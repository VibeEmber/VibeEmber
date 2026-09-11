import { prisma } from "@vibeember/database";
import { apiRoute, requireUser } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiRoute<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  const existing = await prisma.projectVote.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });
  if (existing) {
    await prisma.projectVote.delete({
      where: { userId_projectId: { userId: user.id, projectId: id } },
    });
    return { voted: false };
  }
  await prisma.projectVote.create({ data: { userId: user.id, projectId: id } });
  return { voted: true };
});
