import { apiRoute, requireUser } from "@/lib/server/http";
import { notifyService } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req) => {
  const user = await requireUser(req);
  return notifyService.list(user.id);
});
