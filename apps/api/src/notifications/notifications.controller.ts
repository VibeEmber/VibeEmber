import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { SessionUser } from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { NotifyService } from "../notify/notify.service";

@Controller("notifications")
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notify: NotifyService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.notify.list(user.id);
  }

  @Post("read")
  read(@CurrentUser() user: SessionUser, @Body() body: { ids?: string[] }) {
    return this.notify.markRead(user.id, body.ids);
  }
}
