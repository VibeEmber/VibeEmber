import { prisma } from "@vibeember/database";
import { adminListQuerySchema } from "@vibeember/shared";
import { apiRoute, requireAdmin } from "@/lib/server/http";
import { projectInclude, serializeProject } from "@/lib/server/project-serializer";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req) => {
  await requireAdmin(req);
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const parsed = adminListQuerySchema.safeParse(status);
  const value = parsed.success ? parsed.data : "pending";
  const rows = await prisma.project.findMany({
    where: { status: value },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: projectInclude,
  });
  return {
    projects: rows.map((row) => serializeProject(row, storage, true)),
  };
});
