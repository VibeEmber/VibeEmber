import { loadEnv } from "./env.js";

loadEnv();

import pgBossDefault, { type Job } from "pg-boss";
import QRCode from "qrcode";
import sharp from "sharp";
import { CREDIT } from "@vibeember/shared";
import { prisma } from "@vibeember/database";
import { createStorage } from "@vibeember/storage";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://vibe:vibe@localhost:5432/vibeember";

const storage = createStorage();

interface QrGenerateData {
  projectId: string;
  url: string;
  qrKey: string;
}

interface ImageProcessData {
  key: string;
  kind: "avatar" | "logo";
}

/** 生成产品链接二维码 PNG 并上传 S3 */
async function handleQrGenerate(data: QrGenerateData): Promise<void> {
  const png = await QRCode.toBuffer(data.url, {
    width: 512,
    margin: 2,
    color: { dark: "#171814", light: "#ffffff" },
  });
  await storage.putObject(data.qrKey, png, "image/png");
}

/** 头像/Logo 原图压缩为正方形 WebP，覆盖写回同一个 key（URL 保持不变） */
async function handleImageProcess(data: ImageProcessData): Promise<void> {
  const size = data.kind === "avatar" ? 256 : 512;
  const original = await storage.getObject(data.key);
  const processed = await sharp(original)
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();
  await storage.putObject(data.key, processed, "image/webp");
}

async function main(): Promise<void> {
  const boss = new pgBossDefault({ connectionString: DATABASE_URL });
  await boss.start();
  await boss.createQueue("qr.generate");
  await boss.createQueue("image.process");

  await boss.work("qr.generate", { batchSize: 5 }, async (jobs: Job<QrGenerateData>[]) => {
    for (const job of jobs) {
      try {
        await handleQrGenerate(job.data);
      } catch (error) {
        console.error(`[qr.generate] 项目 ${job.data.projectId} 失败：`, error);
        throw error;
      }
    }
  });

  await boss.work("image.process", { batchSize: 5 }, async (jobs: Job<ImageProcessData>[]) => {
    for (const job of jobs) {
      try {
        await handleImageProcess(job.data);
      } catch (error) {
        console.error(`[image.process] ${job.data.key} 失败：`, error);
        throw error;
      }
    }
  });

  const expireDue = async () => {
    const now = new Date();
    const staleClaims = await prisma.taskClaim.findMany({
      where: { status: "claimed", submitBy: { lt: now } },
    });
    for (const claim of staleClaims) {
      await prisma.taskClaim.update({ where: { id: claim.id }, data: { status: "cancelled" } });
      const task = await prisma.task.findUnique({ where: { id: claim.taskId } });
      if (task) {
        const claimedCount = Math.max(0, task.claimedCount - 1);
        await prisma.task.update({
          where: { id: task.id },
          data: {
            claimedCount,
            status: task.status === "full" && claimedCount < task.quota ? "open" : task.status,
          },
        });
      }
      const user = await prisma.user.findUnique({ where: { id: claim.userId } });
      if (user) {
        const score = Math.max(0, user.creditScore + CREDIT.timeoutDelta);
        await prisma.user.update({ where: { id: user.id }, data: { creditScore: score } });
      }
    }
    const staleTasks = await prisma.task.findMany({
      where: { status: { in: ["open", "full"] }, deadline: { lt: now } },
    });
    for (const task of staleTasks) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { status: "expired", frozenAmount: 0 },
        });
        if (task.frozenAmount > 0) {
          const account = await tx.sparkAccount.upsert({
            where: { userId: task.ownerId },
            update: {},
            create: { userId: task.ownerId, balance: 0, frozen: 0, lifetimeEarned: 0 },
          });
          const nextFrozen = Math.max(0, account.frozen - task.frozenAmount);
          const updated = await tx.sparkAccount.update({
            where: { userId: task.ownerId },
            data: { frozen: nextFrozen },
          });
          await tx.sparkLedger.create({
            data: {
              userId: task.ownerId,
              amount: 0,
              balanceAfter: updated.balance,
              type: "task_refund",
              refType: "task",
              refId: task.id,
              memo: "任务过期，退回未使用冻结",
            },
          });
        }
      });
    }
    if (staleClaims.length || staleTasks.length) {
      console.log(`[task.expire] claims=${staleClaims.length} tasks=${staleTasks.length}`);
    }
  };
  await expireDue();
  const timer = setInterval(() => void expireDue(), 10 * 60 * 1000);

  console.log("VibeEmber worker 已启动（qr.generate / image.process / task.expire）");

  const shutdown = async (signal: string) => {
    console.log(`收到 ${signal}，正在优雅退出…`);
    clearInterval(timer);
    await boss.stop({ graceful: true });
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("worker 启动失败：", error);
  process.exit(1);
});
