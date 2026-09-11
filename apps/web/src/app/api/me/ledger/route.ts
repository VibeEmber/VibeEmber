import { apiRoute, requireUser } from "@/lib/server/http";
import { sparkService } from "@/lib/server/spark";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req) => {
  const user = await requireUser(req);
  return sparkService.listLedger(user.id);
});
