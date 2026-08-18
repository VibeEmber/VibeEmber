import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { SessionUser } from "@vibeember/shared";
import { toWebHeaders } from "../common/headers";
import { AuthService } from "./auth.service";

export interface AuthedRequest extends Request {
  sessionUser?: SessionUser;
}

/** 校验 Better-Auth 会话，并将用户挂到 req.sessionUser */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const user = await this.authService.getSessionUser(toWebHeaders(request.headers));
    if (!user) {
      throw new UnauthorizedException("请先登录");
    }
    request.sessionUser = user;
    return true;
  }
}
