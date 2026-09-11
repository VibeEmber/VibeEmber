import { apiRoute, requireUser } from "@/lib/server/http";
import { tasksService } from "@/lib/server/tasks";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req) => {
  const user = await requireUser(req);
  return tasksService.pendingReviews(user.id);
});
