import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import type { SessionUser } from "@vibeember/shared";
import { readConfig } from "./config";
import { getSessionUser } from "./auth";

/** 业务错误：状态码 + 中文文案，序列化为 `{ error }`（等价原 Nest AllExceptionsFilter 契约） */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, message);
}

export function unauthorized(message: string): ApiError {
  return new ApiError(401, message);
}

export function forbidden(message: string): ApiError {
  return new ApiError(403, message);
}

export function notFound(message: string): ApiError {
  return new ApiError(404, message);
}

/** 写请求的 Origin 校验（Better-Auth 自身路由已内置校验，这里覆盖业务接口）。
 * 未携带 Origin（同源/服务器到服务器）放行——与旧版行为一致。 */
function assertOrigin(req: NextRequest): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin")?.replace(/\/+$/, "");
  if (!origin) return;
  if (origin !== readConfig().webUrl) {
    throw forbidden("请求来源不被允许");
  }
}

/**
 * Route Handler 统一包装：Origin 校验 + 错误信封 + 状态码（POST 默认 201，与原 API 一致）。
 * 用法：`export const GET = apiRoute(async (req) => ({ ... }))`；
 * 带路径参数：`export const GET = apiRoute<{ params: Promise<{ id: string }> }>(async (req, { params }) => ...)`
 */
export function apiRoute<C>(
  handler: (req: NextRequest, ctx: C) => unknown,
): (req: NextRequest, ctx: C) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      assertOrigin(req);
      const data = await handler(req, ctx);
      return NextResponse.json(data ?? {}, { status: req.method === "POST" ? 201 : 200 });
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("[api] 未处理异常：", error);
      return NextResponse.json({ error: "服务暂时异常" }, { status: 500 });
    }
  };
}

/** zod schema 校验请求体，错误消息直接采用 schema 中的中文文案（原 ZodValidationPipe 语义） */
export async function parseBody<S extends ZodType>(
  req: NextRequest,
  schema: S,
): Promise<S["_output"]> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest("请求体不是合法 JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw badRequest(result.error.issues[0]?.message ?? "参数无效");
  }
  return result.data;
}

/** 校验 Better-Auth 会话并返回用户（原 SessionGuard 语义） */
export async function requireUser(req: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(req.headers);
  if (!user) {
    throw unauthorized("请先登录");
  }
  return user;
}

/** 管理员校验（原 RolesGuard("admin") 语义） */
export async function requireAdmin(req: NextRequest): Promise<SessionUser> {
  const user = await requireUser(req);
  if (user.role !== "admin") {
    throw forbidden("需要管理员权限");
  }
  return user;
}
