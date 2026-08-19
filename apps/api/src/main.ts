import "reflect-metadata";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { loadEnv } from "./env";

loadEnv();

// 配置了 HTTPS_PROXY（.env 或环境变量）时让全局 fetch（better-auth 的 GitHub 请求）走代理；
// 必须在 loadEnv 之后、任何 fetch 之前设置
if (process.env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { toNodeHandler } from "better-auth/node";
import { AppModule } from "./app.module";
import { AuthService } from "./auth/auth.service";
import { originCheck } from "./common/origin";
import { AllExceptionsFilter } from "./common/http-exception.filter";
import { readConfig } from "./config";

async function bootstrap(): Promise<void> {
  const config = readConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Better-Auth 以原生 Node 中间件挂载：直接消费原始请求体（须先于 Nest body parser 执行）
  const authService = app.get(AuthService);
  app.use("/api/auth", toNodeHandler(authService.auth));

  app.use(originCheck([config.webUrl]));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  await app.listen(config.apiPort, "0.0.0.0");
  console.log(`VibeEmber API listening on 0.0.0.0:${config.apiPort}`);
}

void bootstrap();
