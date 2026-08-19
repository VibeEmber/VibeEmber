import { Module } from "@nestjs/common";
import { ClaimsController, TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  controllers: [TasksController, ClaimsController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
