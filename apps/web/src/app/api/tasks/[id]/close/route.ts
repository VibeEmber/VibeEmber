import { apiRoute, requireUser } from "@/lib/server/http";
import { tasksService } from "@/lib/server/tasks";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiRoute<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  return tasksService.closeByOwner(user, id);
});
