import { prisma } from "@vibeember/database";
import { commentSchema } from "@vibeember/shared";
import { apiRoute, badRequest, notFound, parseBody, requireUser } from "@/lib/server/http";
import { tooSimilar } from "@/lib/server/normalize";
import { notifyService } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiRoute<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const rows = await prisma.comment.findMany({
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
});

export const POST = apiRoute<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  const body = await parseBody(req, commentSchema);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await prisma.comment.count({
    where: { userId: user.id, createdAt: { gte: today } },
  });
  if (count >= 20) throw badRequest("今天评论太多了");
  const recent = await prisma.comment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  if (recent.some((item) => tooSimilar(item.body, body.body))) {
    throw badRequest("请不要重复发表相似评论");
  }
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw notFound("产品不存在");
  const comment = await prisma.comment.create({
    data: { projectId: id, userId: user.id, body: body.body },
  });
  if (project.ownerId !== user.id) {
    await notifyService.push({
      userId: project.ownerId,
      type: "comment",
      title: "你的产品收到新评论",
      body: body.body.slice(0, 80),
      refType: "project",
      refId: id,
    });
  }
  return { id: comment.id };
});
