import { prisma } from "@vibeember/database";
import { FEEDBACK_TYPE_LABELS, type CommunityWeek, type FeedbackType } from "@vibeember/shared";
import { apiRoute } from "@/lib/server/http";
import { runInBackground } from "@/lib/server/jobs";
import { settlementService } from "@/lib/server/settlement";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  // 懒触发结算：首页周报是高频入口，顺带处理过期/超时
  runInBackground(settlementService.runIfDue());

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [memberCount, accepted] = await Promise.all([
    prisma.user.count(),
    prisma.taskClaim.findMany({
      where: { status: "accepted", reviewedAt: { gte: since } },
      include: {
        user: { select: { id: true, name: true } },
        task: {
          select: {
            feedbackType: true,
            allowPublicSnippet: true,
            projectId: true,
            project: { select: { name: true } },
          },
        },
      },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);

  const projectMap = new Map<string, { name: string; count: number; snippet: string | null }>();
  const helperMap = new Map<string, { name: string; count: number }>();
  let invitedUserCount = 0;

  for (const row of accepted) {
    const project = projectMap.get(row.task.projectId) ?? {
      name: row.task.project.name,
      count: 0,
      snippet: null,
    };
    project.count += 1;
    if (!project.snippet && row.task.allowPublicSnippet && row.feedback) {
      project.snippet = row.feedback.replace(/\s+/g, " ").slice(0, 48);
    }
    projectMap.set(row.task.projectId, project);

    const helper = helperMap.get(row.userId) ?? { name: row.user.name, count: 0 };
    helper.count += 1;
    helperMap.set(row.userId, helper);

    if (row.task.feedbackType === "invite_user") invitedUserCount += 1;
  }

  const cases = [...projectMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([projectId, item]) => ({
      projectId,
      projectName: item.name,
      acceptedCount: item.count,
      snippet: item.snippet,
    }));

  const helpers = [...helperMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([userId, item]) => ({
      userId,
      name: item.name,
      acceptedCount: item.count,
    }));

  const week: CommunityWeek = {
    memberCount,
    acceptedCount: accepted.length,
    helpedProjectCount: projectMap.size,
    helperCount: helperMap.size,
    invitedUserCount,
    cases,
    helpers,
    recent: accepted.slice(0, 2).map((row) => ({
      helperName: row.user.name,
      projectName: row.task.project.name,
      feedbackTypeLabel:
        FEEDBACK_TYPE_LABELS[row.task.feedbackType as FeedbackType] ?? row.task.feedbackType,
      createdAt: (row.reviewedAt ?? row.claimedAt).toISOString(),
    })),
  };
  return week;
});
