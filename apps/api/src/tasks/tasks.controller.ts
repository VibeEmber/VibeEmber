import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  claimReviewSchema,
  claimSubmitSchema,
  reportSchema,
  taskCreateSchema,
  type ClaimReviewInput,
  type ClaimSubmitInput,
  type SessionUser,
  type TaskCreateInput,
} from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.listOpen();
  }

  @Post()
  @UseGuards(SessionGuard)
  create(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(taskCreateSchema)) body: TaskCreateInput,
  ) {
    return this.tasks.create(user, {
      ...body,
      reward: Number(body.reward ?? 10),
      quota: Number(body.quota ?? 5),
    });
  }

  @Post(":id/claim")
  @UseGuards(SessionGuard)
  claim(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.tasks.claim(user, id);
  }

  @Post(":id/close")
  @UseGuards(SessionGuard)
  close(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.tasks.closeByOwner(user, id);
  }
}

@Controller("claims")
@UseGuards(SessionGuard)
export class ClaimsController {
  constructor(private readonly tasks: TasksService) {}

  @Post(":id/submit")
  submit(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(claimSubmitSchema)) body: ClaimSubmitInput,
  ) {
    return this.tasks.submit(user, id, body.answers, body.screenshotKey);
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.tasks.cancel(user, id);
  }

  @Post(":id/review")
  review(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(claimReviewSchema)) body: ClaimReviewInput,
  ) {
    return this.tasks.review(user, id, body.action, body.note ?? "", body.rejectReason);
  }

  @Post(":id/report")
  report(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(reportSchema)) body: { reason: string },
  ) {
    return this.tasks.report(user, id, body.reason);
  }
}
