import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { SessionUser } from "@vibeember/shared";
import type { AuthedRequest } from "./session.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    if (!request.sessionUser) {
      throw new Error("CurrentUser 需要配合 SessionGuard 使用");
    }
    return request.sessionUser;
  },
);
