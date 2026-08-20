import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CREDIT,
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPES,
  REJECT_REASON_LABELS,
  SPARK,
  type FeedbackType,
  type RejectReason,
  type SessionUser,
} from "@vibeember/shared";
import { CreditService } from "../credit/credit.service";
import { tooSimilar } from "../common/normalize";
import { NotifyService } from "../notify/notify.service";
import { PrismaService } from "../prisma/prisma.service";
import { SparkService } from "../spark/spark.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sparks: SparkService,
    private readonly credit: CreditService,
    private readonly notify: NotifyService,
    private readonly storage: StorageService,
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
      feedbackType: string;
      checklist: string[];
      allowPublicSnippet?: boolean;
      reward: number;
      quota: number;
      deadline: string;
    },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
      include: { assets: true },
    });
    if (!project || project.ownerId !== user.id)
      throw new ForbiddenException("只能给自己的产品发起助燃");
    if (project.status !== "approved") throw new BadRequestException("产品通过审核后才能发起助燃");
    if (!this.hasExperienceEntry(project)) {
      throw new BadRequestException("产品还没有可体验入口，先补齐链接或体验码");
    }
    const screenshotCount = project.assets.filter((asset) => asset.kind === "screenshot").length;
    if (screenshotCount < 1) throw new BadRequestException("请先给产品上传至少 1 张截图再发起助燃");
    if (project.helpNeeded.trim().length < 20) {
      throw new BadRequestException("请先把产品「现在最需要的帮助」写到至少 20 字");
    }
    const openCount = await this.prisma.task.count({
      where: { projectId: project.id, status: { in: ["open", "full"] } },
    });
    if (openCount >= SPARK.maxOpenTasksPerProject) {
      throw new BadRequestException("这个产品已有进行中的助燃，先等它结束或满员结算");
    }
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
          feedbackType: input.feedbackType as FeedbackType,
          checklist: input.checklist,
          allowPublicSnippet: input.allowPublicSnippet ?? false,
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
        memo: `发起助燃「${created.title}」冻结 ${freeze} 火苗`,
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
    if (!task) throw new NotFoundException("助燃任务不存在");
    if (task.ownerId === user.id) throw new BadRequestException("不能领取自己的助燃");
    if (task.status !== "open" || task.deadline < new Date()) {
      throw new BadRequestException("助燃已不可领取");
    }
    const existed = await this.prisma.taskClaim.findUnique({
      where: { taskId_userId: { taskId, userId: user.id } },
    });
    if (existed && existed.status !== "cancelled") {
      throw new BadRequestException("你已经领取过这个助燃");
    }

    const submitBy = new Date(Date.now() + SPARK.claimHours * 60 * 60 * 1000);
    const claim = await this.prisma.$transaction(async (tx) => {
      const current = await tx.task.findUnique({ where: { id: taskId } });
      if (!current || current.status !== "open") throw new BadRequestException("助燃已不可领取");
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

  async submit(user: SessionUser, claimId: string, answers: string[], screenshotKey: string) {
    const claim = await this.prisma.taskClaim.findUnique({
      include: { task: { include: { project: true } } },
      where: { id: claimId },
    });
    if (!claim || claim.userId !== user.id) throw new ForbiddenException("只能提交自己的领取");
    if (claim.status !== "claimed") throw new BadRequestException("当前状态不能提交");
    if (claim.submitBy < new Date()) throw new BadRequestException("已超过提交时限");
    const feedback = answers.join("\n");
    if (
      tooSimilar(feedback, claim.task.project.tagline) ||
      tooSimilar(feedback, claim.task.description) ||
      answers.some(
        (answer) =>
          tooSimilar(answer, claim.task.project.tagline) ||
          tooSimilar(answer, claim.task.description),
      )
    ) {
      throw new BadRequestException("反馈不能照抄产品介绍或任务说明");
    }
    const previous = await this.prisma.taskClaim.findMany({
      where: { userId: user.id, status: { in: ["submitted", "accepted"] }, id: { not: claimId } },
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
        answers,
        feedback,
        screenshotKey,
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

  async review(
    user: SessionUser,
    claimId: string,
    action: "accepted" | "rejected",
    note: string,
    rejectReason?: string,
  ) {
    const claim = await this.prisma.taskClaim.findUnique({
      include: { task: true },
      where: { id: claimId },
    });
    if (!claim) throw new NotFoundException("领取不存在");
    if (claim.task.ownerId !== user.id) throw new ForbiddenException("只有发起人可以验收");
    if (claim.status !== "submitted") throw new BadRequestException("只能验收已提交的反馈");

    if (action === "rejected") {
      const reasonLabel = rejectReason
        ? (REJECT_REASON_LABELS[rejectReason as RejectReason] ?? rejectReason)
        : "未说明原因";
      const reviewNote = `${reasonLabel}：${note}`;
      await this.prisma.taskClaim.update({
        where: { id: claimId },
        data: { status: "rejected", reviewNote, reviewedAt: new Date() },
      });
      await this.releaseSlot(claim.taskId);
      await this.credit.adjust(claim.userId, CREDIT.rejectDelta);
      await this.notify.push({
        userId: claim.userId,
        type: "task_rejected",
        title: "助燃反馈未通过",
        body: reviewNote,
        refType: "claim",
        refId: claim.id,
      });
      return { status: "rejected" };
    }

    await this.settleAccept(claim.id, { auto: false, note });
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
    const reviewBefore = new Date(now.getTime() - SPARK.reviewHours * 60 * 60 * 1000);
    const overdueReviews = await this.prisma.taskClaim.findMany({
      where: { status: "submitted", submittedAt: { lt: reviewBefore } },
    });
    for (const claim of overdueReviews) {
      await this.settleAccept(claim.id, { auto: true, note: "发起人超时未验收，系统自动通过" });
    }
    const staleTasks = await this.prisma.task.findMany({
      where: { status: { in: ["open", "full"] }, deadline: { lt: now } },
    });
    for (const task of staleTasks) {
      await this.closeTask(task.id, "expired");
    }
    return {
      expiredClaims: staleClaims.length,
      autoAccepted: overdueReviews.length,
      expiredTasks: staleTasks.length,
    };
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

  async settleAccept(claimId: string, options: { auto: boolean; note: string }) {
    const claim = await this.prisma.taskClaim.findUnique({
      include: { task: true },
      where: { id: claimId },
    });
    if (!claim || claim.status !== "submitted") return;
    await this.prisma.$transaction(async (tx) => {
      await tx.taskClaim.update({
        where: { id: claimId },
        data: {
          status: "accepted",
          reviewNote: options.note,
          autoAccepted: options.auto,
          reviewedAt: new Date(),
        },
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
        memo: options.auto
          ? `超时自动验收，支付赏金 ${claim.task.reward}`
          : `验收通过，支付赏金 ${claim.task.reward}`,
      });
      await this.sparks.applyIn(tx, {
        userId: claim.userId,
        amount: claim.task.reward,
        type: "task_reward",
        refType: "claim",
        refId: claim.id,
        memo: `完成助燃「${claim.task.title}」`,
      });
    });
    await this.credit.adjust(claim.userId, CREDIT.acceptDelta);
    await this.notify.push({
      userId: claim.userId,
      type: "task_accepted",
      title: options.auto ? "助燃已自动验收通过" : "助燃被验收通过",
      body: `获得 ${claim.task.reward} 火苗`,
      refType: "claim",
      refId: claim.id,
    });
    await this.maybeEnqueueSpotCheck(claim.id);
  }

  private async maybeEnqueueSpotCheck(claimId: string) {
    if (Math.random() >= SPARK.spotCheckRate) return;
    const existing = await this.prisma.taskReport.findFirst({
      where: { claimId, kind: "spot_check", status: "pending" },
    });
    if (existing) return;
    const claim = await this.prisma.taskClaim.findUnique({ where: { id: claimId } });
    if (!claim) return;
    await this.prisma.taskReport.create({
      data: {
        claimId,
        reporterId: claim.userId,
        kind: "spot_check",
        reason: "系统抽查已通过的助燃反馈",
      },
    });
  }

  private hasExperienceEntry(project: {
    kind: string;
    url: string;
    extras: unknown;
    assets: Array<{ kind: string }>;
  }) {
    const extras = (project.extras ?? {}) as Record<string, unknown>;
    const hasQr = project.assets.some((asset) => asset.kind === "qr");
    if (project.kind === "web") return Boolean(project.url);
    if (project.kind === "mini_program") return Boolean(extras.miniPlatform) && hasQr;
    if (project.kind === "mobile_app") return Boolean(extras.iosUrl || extras.androidUrl);
    if (project.kind === "desktop") return Boolean(extras.downloadUrl);
    if (project.kind === "social") return Boolean(extras.socialPlatform) && hasQr;
    return false;
  }

  async closeByOwner(user: SessionUser, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("助燃任务不存在");
    if (task.ownerId !== user.id) throw new ForbiddenException("只能结束自己发起的助燃");
    if (task.status !== "open" && task.status !== "full") {
      throw new BadRequestException("这场助燃已经结束");
    }
    const pending = await this.prisma.taskClaim.count({
      where: { taskId, status: "submitted" },
    });
    if (pending > 0) throw new BadRequestException("还有待验收的反馈，先处理完再结束");
    const openClaims = await this.prisma.taskClaim.findMany({
      where: { taskId, status: "claimed" },
    });
    for (const claim of openClaims) {
      await this.releaseClaim(claim.id, "cancelled");
    }
    await this.closeTask(taskId, "closed");
    return { ok: true };
  }

  async myTasks(ownerId: string) {
    const rows = await this.prisma.task.findMany({
      where: { ownerId },
      include: { project: true, owner: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((row) => this.serialize(row));
  }

  async closeTask(taskId: string, status: "closed" | "expired") {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;
    if (task.status === "closed" || task.status === "expired") return;
    const leftover = task.frozenAmount;
    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { status, frozenAmount: leftover > 0 ? 0 : task.frozenAmount },
      });
      if (leftover > 0) {
        await this.sparks.applyIn(tx, {
          userId: task.ownerId,
          amount: 0,
          freezeDelta: -leftover,
          type: "task_refund",
          refType: "task",
          refId: task.id,
          memo: status === "expired" ? "助燃过期，退回未使用冻结" : "结束助燃，退回未使用冻结",
        });
      }
    });
  }

  private serialize(row: {
    id: string;
    projectId: string;
    ownerId: string;
    title: string;
    description: string;
    feedbackType: string;
    checklist: unknown;
    allowPublicSnippet: boolean;
    reward: number;
    quota: number;
    claimedCount: number;
    acceptedCount: number;
    frozenAmount?: number;
    status: string;
    deadline: Date;
    createdAt: Date;
    project: { name: string };
    owner: { name: string };
  }) {
    const feedbackType = row.feedbackType as FeedbackType;
    return {
      id: row.id,
      projectId: row.projectId,
      projectName: row.project.name,
      ownerId: row.ownerId,
      ownerName: row.owner.name,
      title: row.title,
      description: row.description,
      feedbackType,
      feedbackTypeLabel: FEEDBACK_TYPE_LABELS[feedbackType] ?? row.feedbackType,
      checklist: Array.isArray(row.checklist) ? (row.checklist as string[]) : [],
      questions: FEEDBACK_TYPES.find((item) => item.id === feedbackType)?.questions ?? [],
      allowPublicSnippet: row.allowPublicSnippet,
      reward: row.reward,
      quota: row.quota,
      claimedCount: row.claimedCount,
      acceptedCount: row.acceptedCount,
      frozenAmount: row.frozenAmount,
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
    answers: unknown;
    screenshotKey: string | null;
    reviewNote: string;
    autoAccepted: boolean;
    claimedAt: Date;
    submitBy: Date;
    submittedAt: Date | null;
    task: {
      title: string;
      feedbackType: string;
      checklist: unknown;
      project: { name: string };
    };
    user: { name: string; image: string | null };
  }) {
    const feedbackType = row.task.feedbackType as FeedbackType;
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
      answers: Array.isArray(row.answers) ? (row.answers as string[]) : [],
      questions: FEEDBACK_TYPES.find((item) => item.id === feedbackType)?.questions ?? [],
      checklist: Array.isArray(row.task.checklist) ? (row.task.checklist as string[]) : [],
      feedbackType,
      screenshotUrl: row.screenshotKey ? this.storage.publicUrl(row.screenshotKey) : null,
      reviewNote: row.reviewNote,
      autoAccepted: row.autoAccepted,
      claimedAt: row.claimedAt.toISOString(),
      submitBy: row.submitBy.toISOString(),
      submittedAt: row.submittedAt?.toISOString() ?? null,
    };
  }
}
