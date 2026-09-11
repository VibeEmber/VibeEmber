import { apiRoute, requireUser } from "@/lib/server/http";
import { notifyService } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (req) => {
  const user = await requireUser(req);
  let body: { ids?: string[] };
  try {
    body = (await req.json()) as { ids?: string[] };
  } catch {
    body = {};
  }
  return notifyService.markRead(user.id, body.ids);
});
