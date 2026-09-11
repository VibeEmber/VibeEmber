import { taskCreateSchema } from "@vibeember/shared";
import { apiRoute, parseBody, requireUser } from "@/lib/server/http";
import { runInBackground } from "@/lib/server/jobs";
import { settlementService } from "@/lib/server/settlement";
import { tasksService } from "@/lib/server/tasks";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  // 懒触发结算：Serverless 无常驻轮询，浏览任务时顺带处理过期/超时
  runInBackground(settlementService.runIfDue());
  return tasksService.listOpen();
});

export const POST = apiRoute(async (req) => {
  const user = await requireUser(req);
  const body = await parseBody(req, taskCreateSchema);
  return tasksService.create(user, {
    ...body,
    reward: Number(body.reward ?? 10),
    quota: Number(body.quota ?? 5),
  });
});
