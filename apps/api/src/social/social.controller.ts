import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { commentSchema, type SessionUser } from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { tooSimilar } from "../common/normalize";
import { NotifyService } from "../notify/notify.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("projects")
export class SocialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  @Get(":id/comments")
  async comments(@Param("id") id: string) {
    const rows = await this.prisma.comment.findMany({
      where: { projectId: id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      comments: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        userName: row.user.name,
        userAvatarUrl: row.user.image,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  @Post(":id/comments")
  @UseGuards(SessionGuard)
  async createComment(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(commentSchema)) body: { body: string },
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.prisma.comment.count({
      where: { userId: user.id, createdAt: { gte: today } },
    });
    if (count >= 20) throw new BadRequestException("今天评论太多了");
    const recent = await this.prisma.comment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    if (recent.some((item) => tooSimilar(item.body, body.body))) {
      throw new BadRequestException("请不要重复发表相似评论");
    }
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("项目不存在");
    const comment = await this.prisma.comment.create({
      data: { projectId: id, userId: user.id, body: body.body },
    });
    if (project.ownerId !== user.id) {
      await this.notify.push({
        userId: project.ownerId,
        type: "comment",
        title: "你的产品收到新评论",
        body: body.body.slice(0, 80),
        refType: "project",
        refId: id,
      });
    }
    return { id: comment.id };
  }

  @Post(":id/bookmark")
  @UseGuards(SessionGuard)
  async bookmark(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: id } },
    });
    if (existing) {
      await this.prisma.bookmark.delete({
        where: { userId_projectId: { userId: user.id, projectId: id } },
      });
      return { bookmarked: false };
    }
    await this.prisma.bookmark.create({ data: { userId: user.id, projectId: id } });
    return { bookmarked: true };
  }

  @Post(":id/vote")
  @UseGuards(SessionGuard)
  async vote(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    const existing = await this.prisma.projectVote.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: id } },
    });
    if (existing) {
      await this.prisma.projectVote.delete({
        where: { userId_projectId: { userId: user.id, projectId: id } },
      });
      return { voted: false };
    }
    await this.prisma.projectVote.create({ data: { userId: user.id, projectId: id } });
    return { voted: true };
  }
}
