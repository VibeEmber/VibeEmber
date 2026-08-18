import { Global, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SessionGuard } from "./session.guard";
import { RolesGuard } from "./roles.guard";

@Global()
@Module({
  providers: [AuthService, SessionGuard, RolesGuard],
  exports: [AuthService, SessionGuard, RolesGuard],
})
export class AuthModule {}
