import { BadRequestException, Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import type { Prisma } from "@vibeember/database";
import { meUpdateSchema, type MeUpdateInput, type SessionUser } from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { projectInclude, serializeProject } from "../projects/project-serializer";
import { QUEUE_IMAGE_PROCESS, QueueService } from "../queue/queue.service";
import { SparkService } from "../spark/spark.service";
import { StorageService } from "../storage/storage.service";
import { TasksService } from "../tasks/tasks.service";

@Controller("me")
@UseGuards(SessionGuard)
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
    private readonly sparks: SparkService,
    private readonly tasks: TasksService,
  ) {}

  @Get("sparks")
  sparksSummary(@CurrentUser() user: SessionUser) {
    return this.sparks.getSummary(user.id);
  }

  @Get("ledger")
  ledger(@CurrentUser() user: SessionUser) {
    return this.sparks.listLedger(user.id);
  }

  @Get("claims")
  claims(@CurrentUser() user: SessionUser) {
    return this.tasks.myClaims(user.id);
  }

  @Get("reviews")
  reviews(@CurrentUser() user: SessionUser) {
    return this.tasks.pendingReviews(user.id);
  }

  @Get("tasks")
  ownedTasks(@CurrentUser() user: SessionUser) {
    return this.tasks.myTasks(user.id);
  }

  @Get("bookmarks")
  async bookmarks(@CurrentUser() user: SessionUser) {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId: user.id },
      include: { project: { include: projectInclude } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return {
      projects: rows
        .filter((row) => row.project.status === "approved")
        .map((row) => serializeProject(row.project, this.storage, false, { bookmarked: true })),
    };
  }

  @Patch()
  async update(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(meUpdateSchema)) body: MeUpdateInput,
  ): Promise<{ user: SessionUser }> {
    if (body.avatarKey && !body.avatarKey.startsWith(`avatars/${user.id}-`)) {
      throw new BadRequestException("头像文件无效");
    }
    const data: Prisma.UserUpdateInput = {};
    if (body.name) data.name = body.name;
    if (body.bio !== undefined) data.bio = body.bio;
    if (body.avatarKey) data.image = this.storage.publicUrl(body.avatarKey);
    const updated = await this.prisma.user.update({ where: { id: user.id }, data });
    if (body.avatarKey) {
      await this.queue.send(QUEUE_IMAGE_PROCESS, { key: body.avatarKey, kind: "avatar" });
    }
    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        image: updated.image,
        role: updated.role === "admin" ? "admin" : "member",
        bio: updated.bio,
      },
    };
  }
}
