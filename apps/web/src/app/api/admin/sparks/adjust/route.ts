import { sparkAdjustSchema } from "@vibeember/shared";
import { apiRoute, parseBody, requireAdmin } from "@/lib/server/http";
import { sparkService } from "@/lib/server/spark";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (req) => {
  const admin = await requireAdmin(req);
  const body = await parseBody(req, sparkAdjustSchema);
  await sparkService.apply({
    userId: body.userId,
    amount: body.amount,
    type: "admin_adjust",
    memo: `${body.memo}（管理员 ${admin.email}）`,
  });
  return { ok: true };
});
