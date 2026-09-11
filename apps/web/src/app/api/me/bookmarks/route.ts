import { prisma } from "@vibeember/database";
import { apiRoute, requireUser } from "@/lib/server/http";
import { projectInclude, serializeProject } from "@/lib/server/project-serializer";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req) => {
  const user = await requireUser(req);
  const rows = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: { project: { include: projectInclude } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return {
    projects: rows
      .filter((row) => row.project.status === "approved")
      .map((row) => serializeProject(row.project, storage, false, { bookmarked: true })),
  };
});
