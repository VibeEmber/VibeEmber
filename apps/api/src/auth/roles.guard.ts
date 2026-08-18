import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@vibeember/shared";
import { ROLES_KEY } from "./roles.decorator";
import type { AuthedRequest } from "./session.guard";

/** 依赖 SessionGuard 已写入的 req.sessionUser 做角色校验 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    if (request.sessionUser && required.includes(request.sessionUser.role)) {
      return true;
    }
    throw new ForbiddenException("需要管理员权限");
  }
}
