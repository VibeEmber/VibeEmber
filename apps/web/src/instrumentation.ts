/**
 * 服务端启动钩子（next dev / next start / standalone / Vercel 均会执行一次）：
 * - 加载仓库根 .env（Vercel 上环境变量已注入，此处 no-op）
 * - 开发机 HTTPS_PROXY：让全局 fetch（better-auth 的 GitHub 请求）走代理
 * - 长驻模式（dev / Docker）：进程内定时结算，接替原 worker 的 task.expire 轮询；
 *   Vercel Serverless 上不设定时器，由读接口懒触发 + 每日 Cron 覆盖
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { loadEnv } = await import("@/lib/server/env");
  loadEnv();

  if (process.env.HTTPS_PROXY) {
    const { ProxyAgent, setGlobalDispatcher } = await import("undici");
    setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
  }

  if (!process.env.VERCEL) {
    const { settlementService } = await import("@/lib/server/settlement");
    void settlementService
      .runIfDue()
      .catch((error) => console.error("[settlement] 启动结算失败：", error));
    const timer = setInterval(
      () => {
        void settlementService
          .runIfDue()
          .catch((error) => console.error("[settlement] 定时结算失败：", error));
      },
      10 * 60 * 1000,
    );
    timer.unref();
  }
}
