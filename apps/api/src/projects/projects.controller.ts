import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { Prisma } from "@vibeember/database";
import {
  projectCreateSchema,
  type ProjectCreateData,
  type ProjectPublic,
  type SessionUser,
} from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { QUEUE_IMAGE_PROCESS, QUEUE_QR_GENERATE, QueueService } from "../queue/queue.service";
import { StorageService } from "../storage/storage.service";
import { serializeProject, type ProjectWithOwner } from "./project-serializer";

const ownerInclude = {
  owner: { select: { name: true, email: true, image: true } },
} satisfies Prisma.ProjectInclude;

@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
  ) {}

  /** 已过审的公开项目列表 */
  @Get()
  async list(): Promise<{ projects: ProjectPublic[] }> {
    const rows = await this.prisma.project.findMany({
      where: { status: "approved" },
      orderBy: { approvedAt: "desc" },
      take: 100,
      include: ownerInclude,
    });
    return {
      projects: rows.map(
        (row: ProjectWithOwner) => serializeProject(row, this.storage) as ProjectPublic,
      ),
    };
  }

  /** 提交项目（进入待审核队列），并异步生成二维码 / 处理 Logo */
  @Post()
  @HttpCode(201)
  @UseGuards(SessionGuard)
  async create(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(projectCreateSchema)) body: ProjectCreateData,
  ): Promise<{ id: string; status: "pending" }> {
    if (body.logoKey && !body.logoKey.startsWith(`logos/${user.id}-`)) {
      throw new BadRequestException("Logo 文件无效");
    }

    const created = await this.prisma.project.create({
      data: {
        ownerId: user.id,
        name: body.name,
        tagline: body.tagline,
        url: body.url,
        category: body.category,
        helpNeeded: body.helpNeeded,
        logoKey: body.logoKey ?? null,
        qrKey: null,
      },
    });

    // 二维码键位是确定性的：提交后即可推导，worker 生成后即生效
    const qrKey = `qr/${created.id}.png`;
    await this.prisma.project.update({ where: { id: created.id }, data: { qrKey } });

    if (body.logoKey) {
      await this.queue.send(QUEUE_IMAGE_PROCESS, { key: body.logoKey, kind: "logo" });
    }
    await this.queue.send(QUEUE_QR_GENERATE, { projectId: created.id, url: created.url, qrKey });

    return { id: created.id, status: "pending" };
  }

  /** 我的投稿（含私有字段） */
  @Get("mine")
  @UseGuards(SessionGuard)
  async mine(@CurrentUser() user: SessionUser) {
    const rows = await this.prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: ownerInclude,
    });
    return {
      projects: rows.map((row: ProjectWithOwner) => serializeProject(row, this.storage, true)),
    };
  }
}
