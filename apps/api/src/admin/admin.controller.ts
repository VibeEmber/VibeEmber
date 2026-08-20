import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Prisma } from "@vibeember/database";
import {
  adminListQuerySchema,
  reviewSchema,
  type ReviewInput,
  type SessionUser,
} from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CREDIT } from "@vibeember/shared";
import { CreditService } from "../credit/credit.service";
import { NotifyService } from "../notify/notify.service";
import { projectInclude, serializeProject } from "../projects/project-serializer";
import { SparkService } from "../spark/spark.service";
import { reportResolveSchema, sparkAdjustSchema } from "@vibeember/shared";

@Controller("admin/projects")
@UseGuards(SessionGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notify: NotifyService,
  ) {}

  /** 审核队列（按状态筛选，默认待审核，先进先出） */
  @Get()
  async list(@Query("status") status?: string) {
    const parsed = adminListQuerySchema.safeParse(status ?? undefined);
    const value = parsed.success ? parsed.data : "pending";
    const rows = await this.prisma.project.findMany({
      where: { status: value },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: projectInclude,
    });
    return {
      projects: rows.map((row) => serializeProject(row, this.storage, true)),
    };
  }

  /** 审核：通过 / 驳回（写审核审计记录） */
  @Post(":id/review")
  async review(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(reviewSchema)) body: ReviewInput,
  ): Promise<{ id: string; status: string }> {
    const reviewedAt = new Date();
    const existing = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const project = await tx.project.findUnique({ where: { id } });
      if (!project) {
        return null;
      }
      await tx.project.update({
        where: { id },
        data: {
          status: body.action,
          rejectionReason: body.action === "rejected" ? body.reason : "",
          reviewerId: user.id,
          approvedAt: body.action === "approved" ? reviewedAt : null,
        },
      });
      await tx.reviewAudit.create({
        data: {
          projectId: id,
          reviewerId: user.id,
          action: body.action,
          reason: body.reason,
        },
      });
      return project;
    });
    if (!existing) {
      throw new NotFoundException("产品不存在");
    }
    await this.notify.push({
      userId: existing.ownerId,
      type: body.action === "approved" ? "project_approved" : "project_rejected",
      title: body.action === "approved" ? "你的产品已上线" : "你的产品未通过审核",
      body:
        body.action === "approved"
          ? `${existing.name} 已出现在星火场首页。`
          : `${existing.name}：${body.reason}`,
      refType: "project",
      refId: id,
    });
    return { id, status: body.action };
  }
}

@Controller("admin")
@UseGuards(SessionGuard, RolesGuard)
@Roles("admin")
export class AdminOpsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly sparks: SparkService,
    private readonly credit: CreditService,
    private readonly notify: NotifyService,
  ) {}

  @Get("reports")
  async reports() {
    const rows = await this.prisma.taskReport.findMany({
      where: { status: "pending" },
      include: {
        reporter: true,
        claim: { include: { task: { include: { project: true } }, user: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return {
      reports: rows.map((row) => ({
        id: row.id,
        claimId: row.claimId,
        taskTitle: row.claim.task.title,
        reason: row.reason,
        kind: row.kind,
        status: row.status,
        reporterName: row.kind === "spot_check" ? "系统抽查" : row.reporter.name,
        helperName: row.claim.user.name,
        projectName: row.claim.task.project.name,
        reward: row.claim.task.reward,
        claimStatus: row.claim.status,
        answers: Array.isArray(row.claim.answers) ? (row.claim.answers as string[]) : [],
        screenshotUrl: row.claim.screenshotKey
          ? this.storage.publicUrl(row.claim.screenshotKey)
          : null,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  @Post("reports/:id/resolve")
  async resolve(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(reportResolveSchema))
    body: { action: "upheld" | "dismissed"; resolution: string },
  ) {
    const report = await this.prisma.taskReport.findUnique({
      include: { claim: { include: { task: true } } },
      where: { id },
    });
    if (!report || report.status !== "pending") throw new NotFoundException("举报不存在或已处理");
    await this.prisma.taskReport.update({
      where: { id },
      data: {
        status: body.action,
        resolverId: user.id,
        resolution: body.resolution,
        resolvedAt: new Date(),
      },
    });
    const reward = report.claim.task.reward;
    if (
      body.action === "upheld" &&
      report.kind !== "spot_check" &&
      report.claim.status === "rejected"
    ) {
      const stillFrozen = report.claim.task.frozenAmount >= reward;
      await this.prisma.$transaction(async (tx) => {
        await tx.taskClaim.update({
          where: { id: report.claimId },
          data: {
            status: "accepted",
            reviewNote: `管理员改判：${body.resolution}`,
            reviewedAt: new Date(),
          },
        });
        await tx.task.update({
          where: { id: report.claim.taskId },
          data: {
            acceptedCount: { increment: 1 },
            ...(stillFrozen ? { frozenAmount: { decrement: reward } } : {}),
          },
        });
        await this.sparks.applyIn(tx, {
          userId: report.claim.task.ownerId,
          amount: -reward,
          freezeDelta: stillFrozen ? -reward : 0,
          type: stillFrozen ? "task_unfreeze" : "admin_adjust",
          refType: "report",
          refId: report.id,
          memo: stillFrozen ? "举报成立，从冻结款支付赏金" : "举报成立，从发起人可用火苗支付赏金",
        });
        await this.sparks.applyIn(tx, {
          userId: report.claim.userId,
          amount: reward,
          type: "admin_adjust",
          refType: "report",
          refId: report.id,
          memo: "举报成立，补发任务赏金",
        });
      });
      await this.credit.adjust(report.claim.task.ownerId, CREDIT.reportUpheldOwnerDelta);
      await this.notify.push({
        userId: report.claim.userId,
        type: "report_upheld",
        title: "你的举报成立，火苗已补发",
        refType: "claim",
        refId: report.claimId,
      });
      await this.notify.push({
        userId: report.claim.task.ownerId,
        type: "report_upheld_owner",
        title: "助燃举报成立，已从你的火苗支付赏金",
        body: report.claim.task.title,
        refType: "claim",
        refId: report.claimId,
      });
    }
    if (
      body.action === "upheld" &&
      report.kind === "spot_check" &&
      report.claim.status === "accepted"
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.taskClaim.update({
          where: { id: report.claimId },
          data: {
            status: "rejected",
            reviewNote: `抽查未通过：${body.resolution}`,
            reviewedAt: new Date(),
          },
        });
        await tx.task.update({
          where: { id: report.claim.taskId },
          data: { acceptedCount: { decrement: 1 } },
        });
        await this.sparks.applyIn(tx, {
          userId: report.claim.userId,
          amount: -reward,
          type: "admin_adjust",
          refType: "report",
          refId: report.id,
          memo: "抽查未通过，追回任务赏金",
        });
        await this.sparks.applyIn(tx, {
          userId: report.claim.task.ownerId,
          amount: reward,
          type: "admin_adjust",
          refType: "report",
          refId: report.id,
          memo: "抽查追回，退回已支付赏金",
        });
      });
      await this.credit.adjust(report.claim.userId, CREDIT.rejectDelta);
      await this.notify.push({
        userId: report.claim.userId,
        type: "spot_check_upheld",
        title: "抽查未通过，火苗已追回",
        body: body.resolution,
        refType: "claim",
        refId: report.claimId,
      });
    }
    return { ok: true };
  }

  @Post("sparks/adjust")
  async adjust(
    @CurrentUser() admin: SessionUser,
    @Body(new ZodValidationPipe(sparkAdjustSchema))
    body: { userId: string; amount: number; memo: string },
  ) {
    await this.sparks.apply({
      userId: body.userId,
      amount: body.amount,
      type: "admin_adjust",
      memo: `${body.memo}（管理员 ${admin.email}）`,
    });
    return { ok: true };
  }
}
