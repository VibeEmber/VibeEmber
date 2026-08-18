import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { MailModule } from "./mail/mail.module";
import { MeModule } from "./me/me.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectsModule } from "./projects/projects.module";
import { QueueModule } from "./queue/queue.module";
import { StorageModule } from "./storage/storage.module";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    MailModule,
    StorageModule,
    QueueModule,
    AuthModule,
    HealthModule,
    ProjectsModule,
    AdminModule,
    UploadsModule,
    MeModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
