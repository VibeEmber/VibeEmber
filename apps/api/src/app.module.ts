import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { CommunityModule } from "./community/community.module";
import { CreditModule } from "./credit/credit.module";
import { HealthModule } from "./health/health.module";
import { MailModule } from "./mail/mail.module";
import { MeModule } from "./me/me.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { NotifyModule } from "./notify/notify.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectsModule } from "./projects/projects.module";
import { QueueModule } from "./queue/queue.module";
import { SocialModule } from "./social/social.module";
import { SparkModule } from "./spark/spark.module";
import { StorageModule } from "./storage/storage.module";
import { TasksModule } from "./tasks/tasks.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    MailModule,
    StorageModule,
    QueueModule,
    SparkModule,
    NotifyModule,
    CreditModule,
    AuthModule,
    HealthModule,
    ProjectsModule,
    CommunityModule,
    AdminModule,
    UploadsModule,
    MeModule,
    TasksModule,
    SocialModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
