import { apiRoute, unauthorized } from "@/lib/server/http";
import { readConfig } from "@/lib/server/config";
import { settlementService } from "@/lib/server/settlement";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron 入口（每日一次，Hobby 频率上限）。Vercel 调度器会携带
 * `Authorization: Bearer ${CRON_SECRET}` 请求头；未配置 secret 时一律 401。
 */
export const GET = apiRoute(async (req) => {
  const secret = readConfig().cronSecret;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    throw unauthorized("无效的 Cron 凭据");
  }
  await settlementService.runIfDue();
  return { ok: true };
});
