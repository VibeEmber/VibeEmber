import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 开发态同源代理：浏览器只访问 :3000，/api 转发给本机 NestJS，
  // 会话 Cookie 始终同源；生产由 Caddy 在网关层完成同样分流。
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
