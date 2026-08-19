import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CREDIT, SPARK, type SessionUser } from "@vibeember/shared";
import { CreditService } from "../credit/credit.service";
import { tooSimilar } from "../common/normalize";
import { NotifyService } from "../notify/notify.service";
import { PrismaService } from "../prisma/prisma.service";
import { SparkService } from "../spark/spark.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sparks: SparkService,
    private readonly credit: CreditService,
    private readonly notify: NotifyService,
  ) {}

  async listOpen() {
    const rows = await this.prisma.task.findMany({
      where: { status: { in: ["open", "full"] }, deadline: { gt: new Date() } },
      include: { project: true, owner: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((row) => this.serialize(row));
  }

  async create(
    user: SessionUser,
    input: {
      projectId: string;
      title: string;
      description: string;
      reward: number;
      quota: number;
      deadline: string;
    },
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project || project.ownerId !== user.id)
      throw new ForbiddenException("只能给自己的项目发起任务");
    if (project.status !== "approved") throw new BadRequestException("项目通过审核后才能发起助燃");
    const deadline = new Date(input.deadline);
    if (deadline.getTime() < Date.now() + 60 * 60 * 1000) {
      throw new BadRequestException("截止时间至少要比现在晚 1 小时");
    }
    const freeze = input.reward * input.quota;
    const summary = await this.sparks.getSummary(user.id);
    if (summary.available < freeze) throw new BadRequestException("可用火苗不足，无法冻结赏金");

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          projectId: project.id,
          ownerId: user.id,
          title: input.title,
          description: input.description,
          reward: input.reward,
          quota: input.quota,
          frozenAmount: freeze,
          deadline,
        },
      });
      await this.sparks.applyIn(tx, {
        userId: user.id,
        amount: 0,
        freezeDelta: freeze,
        type: "task_freeze",
        refType: "task",
        refId: created.id,
        memo: `发起任务「${created.title}」冻结 ${freeze} 火苗`,
      });
      return created;
    });
    return { id: task.id, status: task.status };
  }

  async claim(user: SessionUser, taskId: string) {
    await this.credit.assertCanClaim(user.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.taskClaim.count({
      where: { userId: user.id, claimedAt: { gte: todayStart } },
    });
    if (todayCount >= 10) throw new BadRequestException("今天领取太多了，明天再来");

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("任务不存在");
    if (task.ownerId === user.id) throw new BadRequestException("不能领取自己的任务");
    if (task.status !== "open" || task.deadline < new Date()) {
      throw new BadRequestException("任务已不可领取");
    }
    const existed = await this.prisma.taskClaim.findUnique({
      where: { taskId_userId: { taskId, userId: user.id } },
    });
    if (existed && existed.status !== "cancelled") {
      throw new BadRequestException("你已经领取过这个任务");
    }

    const submitBy = new Date(Date.now() + SPARK.claimHours * 60 * 60 * 1000);
    const claim = await this.prisma.$transaction(async (tx) => {
      const current = await tx.task.findUnique({ where: { id: taskId } });
      if (!current || current.status !== "open") throw new BadRequestException("任务已不可领取");
      if (current.claimedCount >= current.quota) throw new BadRequestException("名额已满");
      const saved = existed
        ? await tx.taskClaim.update({
            where: { id: existed.id },
            data: {
              status: "claimed",
              claimedAt: new Date(),
              submitBy,
              feedback: "",
              reviewNote: "",
            },
          })
        : await tx.taskClaim.create({
            data: { taskId, userId: user.id, submitBy },
          });
      const claimedCount = current.claimedCount + 1;
      await tx.task.update({
        where: { id: taskId },
        data: { claimedCount, status: claimedCount >= current.quota ? "full" : "open" },
      });
      return saved;
    });
    await this.notify.push({
      userId: task.ownerId,
      type: "task_claimed",
      title: "有人领取了你的助燃任务",
      body: task.title,
      refType: "task",
      refId: task.id,
    });
    return { id: claim.id, status: claim.status, submitBy: claim.submitBy.toISOString() };
  }

  async submit(
    user: SessionUser,
    claimId: string,
    feedback: string,
    screenshotKey?: string | null,
  ) {
    const claim = await this.prisma.taskClaim.findUnique({
      include: { task: { include: { project: true } } },
      where: { id: claimId },
    });
    if (!claim || claim.userId !== user.id) throw new ForbiddenException("只能提交自己的领取");
    if (claim.status !== "claimed") throw new BadRequestException("当前状态不能提交");
    if (claim.submitBy < new Date()) throw new BadRequestException("已超过提交时限");
    if (
      tooSimilar(feedback, claim.task.project.tagline) ||
      tooSimilar(feedback, claim.task.description)
    ) {
      throw new BadRequestException("反馈不能照抄产品介绍或任务说明");
    }
    const previous = await this.prisma.taskClaim.findMany({
      where: { userId: user.id, status: "submitted", id: { not: claimId } },
      take: 5,
      orderBy: { submittedAt: "desc" },
    });
    if (previous.some((item) => tooSimilar(feedback, item.feedback))) {
      throw new BadRequestException("请不要重复提交相似反馈");
    }

    await this.prisma.taskClaim.update({
      where: { id: claimId },
      data: {
        status: "submitted",
        feedback,
        screenshotKey: screenshotKey ?? null,
        submittedAt: new Date(),
      },
    });
    await this.notify.push({
      userId: claim.task.ownerId,
      type: "task_submitted",
      title: "有助燃反馈待你验收",
      body: claim.task.title,
      refType: "claim",
      refId: claim.id,
    });
    return { ok: true };
  }

  async cancel(user: SessionUser, claimId: string) {
    const claim = await this.prisma.taskClaim.findUnique({
      include: { task: true },
      where: { id: claimId },
    });
    if (!claim || claim.userId !== user.id) throw new ForbiddenException("只能取消自己的领取");
    if (claim.status !== "claimed") throw new BadRequestException("已提交的领取不能取消");
    await this.releaseClaim(claim.id, "cancelled");
    return { ok: true };
  }

  async review(user: SessionUser, claimId: string, action: "accepted" | "rejected", note: string) {
    const claim = await this.prisma.taskClaim.findUnique({
      include: { task: true },
      where: { id: claimId },
    });
    if (!claim) throw new NotFoundException("领取不存在");
    if (claim.task.ownerId !== user.id) throw new ForbiddenException("只有发起人可以验收");
    if (claim.status !== "submitted") throw new BadRequestException("只能验收已提交的反馈");

    if (action === "rejected") {
      await this.prisma.taskClaim.update({
        where: { id: claimId },
        data: { status: "rejected", reviewNote: note, reviewedAt: new Date() },
      });
      await this.releaseSlot(claim.taskId);
      await this.credit.adjust(claim.userId, CREDIT.rejectDelta);
      await this.notify.push({
        userId: claim.userId,
        type: "task_rejected",
        title: "助燃反馈未通过",
        body: note,
        refType: "claim",
        refId: claim.id,
      });
      return { status: "rejected" };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.taskClaim.update({
        where: { id: claimId },
        data: { status: "accepted", reviewNote: note, reviewedAt: new Date() },
      });
      await tx.task.update({
        where: { id: claim.taskId },
        data: { acceptedCount: { increment: 1 }, frozenAmount: { decrement: claim.task.reward } },
      });
      await this.sparks.applyIn(tx, {
        userId: claim.task.ownerId,
        amount: -claim.task.reward,
        freezeDelta: -claim.task.reward,
        type: "task_unfreeze",
        refType: "claim",
        refId: claim.id,
        memo: `验收通过，支付赏金 ${claim.task.reward}`,
      });
      await this.sparks.applyIn(tx, {
        userId: claim.userId,
        amount: claim.task.reward,
        type: "task_reward",
        refType: "claim",
        refId: claim.id,
        memo: `完成任务「${claim.task.title}」`,
      });
    });
    await this.credit.adjust(claim.userId, CREDIT.acceptDelta);
    await this.notify.push({
      userId: claim.userId,
      type: "task_accepted",
      title: "助燃被验收通过",
      body: `获得 ${claim.task.reward} 火苗`,
      refType: "claim",
      refId: claim.id,
    });
    return { status: "accepted" };
  }

  async report(user: SessionUser, claimId: string, reason: string) {
    const claim = await this.prisma.taskClaim.findUnique({ where: { id: claimId } });
    if (!claim || claim.userId !== user.id) throw new ForbiddenException("只能举报自己的领取");
    if (claim.status !== "rejected") throw new BadRequestException("只有被驳回的领取才能举报");
    const existing = await this.prisma.taskReport.findFirst({
      where: { claimId, reporterId: user.id, status: "pending" },
    });
    if (existing) throw new BadRequestException("已有处理中的举报");
    const report = await this.prisma.taskReport.create({
      data: { claimId, reporterId: user.id, reason },
    });
    return { id: report.id };
  }

  async myClaims(userId: string) {
    const rows = await this.prisma.taskClaim.findMany({
      where: { userId },
      include: { task: { include: { project: true } }, user: true },
      orderBy: { claimedAt: "desc" },
    });
    return rows.map((row) => this.serializeClaim(row));
  }

  async pendingReviews(ownerId: string) {
    const rows = await this.prisma.taskClaim.findMany({
      where: { status: "submitted", task: { ownerId } },
      include: { task: { include: { project: true } }, user: true },
      orderBy: { submittedAt: "asc" },
    });
    return rows.map((row) => this.serializeClaim(row));
  }

  async expireDue() {
    const now = new Date();
    const staleClaims = await this.prisma.taskClaim.findMany({
      where: { status: "claimed", submitBy: { lt: now } },
    });
    for (const claim of staleClaims) {
      await this.releaseClaim(claim.id, "cancelled");
      await this.credit.adjust(claim.userId, CREDIT.timeoutDelta);
    }
    const staleTasks = await this.prisma.task.findMany({
      where: { status: { in: ["open", "full"] }, deadline: { lt: now } },
    });
    for (const task of staleTasks) {
      await this.closeTask(task.id, "expired");
    }
    return { expiredClaims: staleClaims.length, expiredTasks: staleTasks.length };
  }

  private async releaseClaim(claimId: string, status: "cancelled") {
    const claim = await this.prisma.taskClaim.findUnique({ where: { id: claimId } });
    if (!claim) return;
    await this.prisma.taskClaim.update({ where: { id: claimId }, data: { status } });
    await this.releaseSlot(claim.taskId);
  }

  private async releaseSlot(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;
    const claimedCount = Math.max(0, task.claimedCount - 1);
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        claimedCount,
        status: task.status === "full" && claimedCount < task.quota ? "open" : task.status,
      },
    });
  }

  async closeTask(taskId: string, status: "closed" | "expired") {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.frozenAmount <= 0) {
      if (task) await this.prisma.task.update({ where: { id: taskId }, data: { status } });
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: taskId }, data: { status, frozenAmount: 0 } });
      await this.sparks.applyIn(tx, {
        userId: task.ownerId,
        amount: 0,
        freezeDelta: -task.frozenAmount,
        type: "task_refund",
        refType: "task",
        refId: task.id,
        memo: status === "expired" ? "任务过期，退回未使用冻结" : "关闭任务，退回未使用冻结",
      });
    });
  }

  private serialize(row: {
    id: string;
    projectId: string;
    ownerId: string;
    title: string;
    description: string;
    reward: number;
    quota: number;
    claimedCount: number;
    acceptedCount: number;
    status: string;
    deadline: Date;
    createdAt: Date;
    project: { name: string };
    owner: { name: string };
  }) {
    return {
      id: row.id,
      projectId: row.projectId,
      projectName: row.project.name,
      ownerId: row.ownerId,
      ownerName: row.owner.name,
      title: row.title,
      description: row.description,
      reward: row.reward,
      quota: row.quota,
      claimedCount: row.claimedCount,
      acceptedCount: row.acceptedCount,
      status: row.status,
      deadline: row.deadline.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private serializeClaim(row: {
    id: string;
    taskId: string;
    userId: string;
    status: string;
    feedback: string;
    screenshotKey: string | null;
    reviewNote: string;
    claimedAt: Date;
    submitBy: Date;
    submittedAt: Date | null;
    task: { title: string; project: { name: string } };
    user: { name: string; image: string | null };
  }) {
    return {
      id: row.id,
      taskId: row.taskId,
      taskTitle: row.task.title,
      projectName: row.task.project.name,
      userId: row.userId,
      userName: row.user.name,
      userAvatarUrl: row.user.image,
      status: row.status,
      feedback: row.feedback,
      screenshotUrl: row.screenshotKey,
      reviewNote: row.reviewNote,
      claimedAt: row.claimedAt.toISOString(),
      submitBy: row.submitBy.toISOString(),
      submittedAt: row.submittedAt?.toISOString() ?? null,
    };
  }
}
