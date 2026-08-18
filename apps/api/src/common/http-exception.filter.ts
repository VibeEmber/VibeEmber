import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

/** 统一错误响应为 { error: "中文文案" }，保持与前端契约一致 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "服务暂时异常";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object" && "message" in body) {
        const raw = (body as { message: unknown }).message;
        message = Array.isArray(raw) ? String(raw[0]) : String(raw);
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      console.error("[api] 未处理异常：", exception);
    }

    response.status(status).json({ error: message });
  }
}
