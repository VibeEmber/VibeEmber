import { BadRequestException, Body, Controller, Patch, UseGuards } from "@nestjs/common";
import type { Prisma } from "@vibeember/database";
import { meUpdateSchema, type MeUpdateInput, type SessionUser } from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { QUEUE_IMAGE_PROCESS, QueueService } from "../queue/queue.service";
import { StorageService } from "../storage/storage.service";

@Controller("me")
@UseGuards(SessionGuard)
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
  ) {}

  /** 更新昵称 / 头像（头像直传后绑定 key，并触发 worker 压缩处理） */
  @Patch()
  async update(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(meUpdateSchema)) body: MeUpdateInput,
  ): Promise<{ user: SessionUser }> {
    if (body.avatarKey && !body.avatarKey.startsWith(`avatars/${user.id}-`)) {
      throw new BadRequestException("头像文件无效");
    }

    const data: Prisma.UserUpdateInput = {};
    if (body.name) {
      data.name = body.name;
    }
    if (body.avatarKey) {
      data.image = this.storage.publicUrl(body.avatarKey);
    }

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
      },
    };
  }
}
