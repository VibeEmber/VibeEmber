import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

/**
 * Better-Auth 浏览器客户端：默认同源 /api/auth
 * （dev 由 Next rewrite 代理到 api:4000，生产由 Caddy 分流）。
 * 不显式传 baseURL，避免 Next 预渲染（服务端无 window）时报错。
 */
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});
