import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import type PgBoss from "pg-boss";
import { readConfig } from "../config";

export const QUEUE_QR_GENERATE = "qr.generate";
export const QUEUE_IMAGE_PROCESS = "image.process";

/**
 * pg-boss 生产者（队列即 PG，无需 Redis）。
 * pg-boss 为 ESM-only，使用动态 import 兼容 Nest 的 CJS 构建。
 */
@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private boss?: PgBoss;
  private readonly connectionString = readConfig().databaseUrl;

  async onModuleInit(): Promise<void> {
    const { default: PgBoss } = await import("pg-boss");
    this.boss = new PgBoss({ connectionString: this.connectionString });
    await this.boss.start();
    // pg-boss v10：必须先建队列才能 send / work
    await this.boss.createQueue(QUEUE_QR_GENERATE);
    await this.boss.createQueue(QUEUE_IMAGE_PROCESS);
  }

  async send(name: string, data: Record<string, unknown>): Promise<void> {
    if (!this.boss) {
      throw new Error("队列尚未就绪");
    }
    await this.boss.send(name, data);
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss?.stop({ graceful: false });
  }
}
