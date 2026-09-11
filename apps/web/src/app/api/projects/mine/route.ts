import { prisma } from "@vibeember/database";
import { apiRoute, requireUser } from "@/lib/server/http";
import { projectInclude, serializeProject } from "@/lib/server/project-serializer";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req) => {
  const user = await requireUser(req);
  const rows = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: projectInclude,
  });
  return { projects: rows.map((row) => serializeProject(row, storage, true)) };
});
