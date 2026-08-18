import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

/**
 * 可选加载仓库根 .env（开发覆盖默认值用）。
 * 直接运行（cwd=apps/api）与容器（无 .env，使用注入的环境变量）都兼容。
 */
export function loadEnv(): void {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      config({ path: candidate });
      return;
    }
  }
}
