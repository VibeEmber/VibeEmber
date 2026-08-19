import { Module } from "@nestjs/common";
import { TasksModule } from "../tasks/tasks.module";
import { MeController } from "./me.controller";

@Module({
  imports: [TasksModule],
  controllers: [MeController],
})
export class MeModule {}
