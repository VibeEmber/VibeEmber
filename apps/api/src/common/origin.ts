import type { NextFunction, Request, Response } from "express";

/**
 * 写请求的 Origin 校验（Better-Auth 自身路由已内置校验，这里覆盖业务接口）。
 * 与旧版 Python API 行为一致：未携带 Origin（同源/服务器到服务器）放行。
 */
export function originCheck(allowedOrigins: string[]) {
  const allowed = new Set(allowedOrigins.map((origin) => origin.replace(/\/+$/, "")));
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.path.startsWith("/api/auth")) {
      next();
      return;
    }
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      next();
      return;
    }
    const origin = req.headers.origin?.replace(/\/+$/, "");
    if (origin && !allowed.has(origin)) {
      res.status(403).json({ error: "请求来源不被允许" });
      return;
    }
    next();
  };
}
