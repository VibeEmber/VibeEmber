import { Module } from "@nestjs/common";
import { AdminController, AdminOpsController } from "./admin.controller";

@Module({
  controllers: [AdminController, AdminOpsController],
})
export class AdminModule {}
