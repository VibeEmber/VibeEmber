import { prisma } from "@vibeember/database";
import { creditBand } from "@vibeember/shared";
import { apiRoute, notFound } from "@/lib/server/http";
import { projectInclude, serializeProject } from "@/lib/server/project-serializer";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiRoute<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      sparkAccount: true,
      projects: {
        where: { status: "approved" },
        include: projectInclude,
        orderBy: { approvedAt: "desc" },
      },
    },
  });
  if (!user) throw notFound("用户不存在");
  const helpCount = await prisma.taskClaim.count({
    where: { userId: id, status: "accepted" },
  });
  return {
    id: user.id,
    name: user.name,
    image: user.image,
    bio: user.bio,
    creditBand: creditBand(user.creditScore),
    creditScore: user.creditScore,
    projectCount: user.projects.length,
    helpCount,
    lifetimeEarned: user.sparkAccount?.lifetimeEarned ?? 0,
    projects: user.projects.map((project) => serializeProject(project, storage)),
  };
});
