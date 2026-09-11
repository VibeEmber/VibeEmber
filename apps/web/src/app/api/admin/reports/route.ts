import { prisma } from "@vibeember/database";
import { apiRoute, requireAdmin } from "@/lib/server/http";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req) => {
  await requireAdmin(req);
  const rows = await prisma.taskReport.findMany({
    where: { status: "pending" },
    include: {
      reporter: true,
      claim: { include: { task: { include: { project: true } }, user: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return {
    reports: rows.map((row) => ({
      id: row.id,
      claimId: row.claimId,
      taskTitle: row.claim.task.title,
      reason: row.reason,
      kind: row.kind,
      status: row.status,
      reporterName: row.kind === "spot_check" ? "系统抽查" : row.reporter.name,
      helperName: row.claim.user.name,
      projectName: row.claim.task.project.name,
      reward: row.claim.task.reward,
      claimStatus: row.claim.status,
      answers: Array.isArray(row.claim.answers) ? (row.claim.answers as string[]) : [],
      screenshotUrl: row.claim.screenshotKey ? storage.publicUrl(row.claim.screenshotKey) : null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
});
