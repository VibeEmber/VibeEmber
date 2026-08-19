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
    private readonly sparks: SparkService,
    private readonly credit: CreditService,
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
      throw new NotFoundException("项目不存在");
    }
    return { id, status: body.action };
  }
}

@Controller("admin")
@UseGuards(SessionGuard, RolesGuard)
@Roles("admin")
export class AdminOpsController {
  constructor(
    private readonly prisma: PrismaService,
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
        claim: { include: { task: true, user: true } },
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
        status: row.status,
        reporterName: row.reporter.name,
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
    if (body.action === "upheld" && report.claim.status === "rejected") {
      await this.prisma.taskClaim.update({
        where: { id: report.claimId },
        data: {
          status: "accepted",
          reviewNote: `管理员改判：${body.resolution}`,
          reviewedAt: new Date(),
        },
      });
      await this.sparks.apply({
        userId: report.claim.userId,
        amount: report.claim.task.reward,
        type: "admin_adjust",
        refType: "report",
        refId: report.id,
        memo: "举报成立，补发任务赏金",
      });
      await this.credit.adjust(report.claim.task.ownerId, CREDIT.reportUpheldOwnerDelta);
      await this.notify.push({
        userId: report.claim.userId,
        type: "report_upheld",
        title: "你的举报成立，火苗已补发",
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
