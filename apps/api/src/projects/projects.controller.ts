import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  projectCreateSchema,
  type ProjectCreateData,
  type ProjectPublic,
  type SessionUser,
} from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { toWebHeaders } from "../common/headers";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { QUEUE_IMAGE_PROCESS, QUEUE_QR_GENERATE, QueueService } from "../queue/queue.service";
import { StorageService } from "../storage/storage.service";
import { AuthService } from "../auth/auth.service";
import { projectInclude, serializeProject } from "./project-serializer";

@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(@Headers() headers: Record<string, unknown>): Promise<{ projects: ProjectPublic[] }> {
    const viewer = await this.auth.getSessionUser(toWebHeaders(headers));
    const rows = await this.prisma.project.findMany({
      where: { status: "approved" },
      orderBy: { approvedAt: "desc" },
      take: 100,
      include: projectInclude,
    });
    const votes = viewer
      ? await this.prisma.projectVote.findMany({
          where: { userId: viewer.id, projectId: { in: rows.map((row) => row.id) } },
        })
      : [];
    const bookmarks = viewer
      ? await this.prisma.bookmark.findMany({
          where: { userId: viewer.id, projectId: { in: rows.map((row) => row.id) } },
        })
      : [];
    const voted = new Set(votes.map((item) => item.projectId));
    const bookmarked = new Set(bookmarks.map((item) => item.projectId));
    return {
      projects: rows.map((row) =>
        serializeProject(row, this.storage, false, {
          voted: voted.has(row.id),
          bookmarked: bookmarked.has(row.id),
        }),
      ) as ProjectPublic[],
    };
  }

  @Post()
  @HttpCode(201)
  @UseGuards(SessionGuard)
  async create(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(projectCreateSchema)) body: ProjectCreateData,
  ): Promise<{ id: string; status: "pending" }> {
    this.assertAssetKeys(user.id, body);
    const created = await this.prisma.project.create({
      data: {
        ownerId: user.id,
        name: body.name,
        tagline: body.tagline,
        url: body.url ?? "",
        kind: body.kind as never,
        topics: body.topics,
        extras: body.extras ?? {},
        helpNeeded: body.helpNeeded,
        logoKey: body.logoKey ?? null,
        assets: { create: this.assetCreates(body) },
      },
    });
    await this.afterSave(created.id, body);
    return { id: created.id, status: "pending" };
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(projectCreateSchema)) body: ProjectCreateData,
  ): Promise<{ id: string; status: "pending" }> {
    this.assertAssetKeys(user.id, body);
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("产品不存在");
    if (project.ownerId !== user.id) throw new ForbiddenException("只能修改自己的产品");
    if (project.status !== "rejected")
      throw new BadRequestException("只有被驳回的产品可以修改后再投");

    await this.prisma.$transaction(async (tx) => {
      await tx.projectAsset.deleteMany({ where: { projectId: id } });
      await tx.project.update({
        where: { id },
        data: {
          name: body.name,
          tagline: body.tagline,
          url: body.url ?? "",
          kind: body.kind as never,
          topics: body.topics,
          extras: body.extras ?? {},
          helpNeeded: body.helpNeeded,
          logoKey: body.logoKey ?? null,
          status: "pending",
          rejectionReason: "",
          reviewerId: null,
          approvedAt: null,
          assets: { create: this.assetCreates(body) },
        },
      });
    });
    await this.afterSave(id, body);
    return { id, status: "pending" };
  }

  @Get("mine")
  @UseGuards(SessionGuard)
  async mine(@CurrentUser() user: SessionUser) {
    const rows = await this.prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: projectInclude,
    });
    return { projects: rows.map((row) => serializeProject(row, this.storage, true)) };
  }

  /** 产品详情（仅公开项目；登录时附带点赞/收藏状态） */
  @Get(":id")
  async detail(@Param("id") id: string, @Headers() headers: Record<string, unknown>) {
    const viewer = await this.auth.getSessionUser(toWebHeaders(headers));
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });
    if (!project || project.status !== "approved") {
      throw new NotFoundException("产品不存在或未公开");
    }
    const voted = viewer
      ? Boolean(
          await this.prisma.projectVote.findUnique({
            where: { userId_projectId: { userId: viewer.id, projectId: id } },
          }),
        )
      : false;
    const bookmarked = viewer
      ? Boolean(
          await this.prisma.bookmark.findUnique({
            where: { userId_projectId: { userId: viewer.id, projectId: id } },
          }),
        )
      : false;
    return {
      project: serializeProject(project, this.storage, false, { voted, bookmarked }),
    };
  }

  private assertAssetKeys(userId: string, body: ProjectCreateData) {
    if (body.logoKey && !body.logoKey.startsWith(`logos/${userId}-`)) {
      throw new BadRequestException("Logo 文件无效");
    }
    for (const key of body.screenshotKeys ?? []) {
      if (!key.startsWith(`screenshots/${userId}-`)) throw new BadRequestException("截图文件无效");
    }
    if (body.extraQrKey && !body.extraQrKey.startsWith(`qrs/${userId}-`)) {
      throw new BadRequestException("二维码文件无效");
    }
  }

  private assetCreates(body: ProjectCreateData) {
    return [
      ...(body.screenshotKeys ?? []).map((key, index) => ({
        kind: "screenshot" as const,
        key,
        sort: index,
      })),
      ...(body.extraQrKey ? [{ kind: "qr" as const, key: body.extraQrKey, sort: 0 }] : []),
    ];
  }

  private async afterSave(projectId: string, body: ProjectCreateData) {
    if (body.url) {
      const qrKey = `qr/${projectId}.png`;
      await this.prisma.project.update({ where: { id: projectId }, data: { qrKey } });
      await this.queue.send(QUEUE_QR_GENERATE, { projectId, url: body.url, qrKey });
    }
    if (body.logoKey)
      await this.queue.send(QUEUE_IMAGE_PROCESS, { key: body.logoKey, kind: "logo" });
    for (const key of body.screenshotKeys ?? []) {
      await this.queue.send(QUEUE_IMAGE_PROCESS, { key, kind: "screenshot" });
    }
    if (body.extraQrKey) {
      await this.queue.send(QUEUE_IMAGE_PROCESS, { key: body.extraQrKey, kind: "logo" });
    }
  }
}
