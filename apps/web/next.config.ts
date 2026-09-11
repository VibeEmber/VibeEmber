import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 仅服务 Docker 自托管（deploy/Dockerfile.web）；Vercel 构建时忽略
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
