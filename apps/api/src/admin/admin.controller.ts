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
import { serializeProject, type ProjectWithOwner } from "../projects/project-serializer";

const ownerInclude = {
  owner: { select: { name: true, email: true, image: true } },
} as const;

@Controller("admin/projects")
@UseGuards(SessionGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
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
      include: ownerInclude,
    });
    return {
      projects: rows.map((row: ProjectWithOwner) => serializeProject(row, this.storage, true)),
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
