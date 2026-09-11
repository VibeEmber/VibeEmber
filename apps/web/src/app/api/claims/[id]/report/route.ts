import { reportSchema } from "@vibeember/shared";
import { apiRoute, parseBody, requireUser } from "@/lib/server/http";
import { tasksService } from "@/lib/server/tasks";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiRoute<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  const body = await parseBody(req, reportSchema);
  return tasksService.report(user, id, body.reason);
});
