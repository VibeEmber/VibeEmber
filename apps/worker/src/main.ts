import { loadEnv } from "./env.js";

loadEnv();

import pgBossDefault, { type Job } from "pg-boss";
import QRCode from "qrcode";
import sharp from "sharp";
import { CREDIT, SPARK } from "@vibeember/shared";
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
  kind: "avatar" | "logo" | "screenshot";
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

/** 头像/Logo 压成方形；产品截图只限制长边，避免证据被裁切 */
async function handleImageProcess(data: ImageProcessData): Promise<void> {
  const original = await storage.getObject(data.key);
  const pipeline = sharp(original);
  const processed =
    data.kind === "screenshot"
      ? await pipeline
          .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer()
      : await pipeline
          .resize(data.kind === "avatar" ? 256 : 512, data.kind === "avatar" ? 256 : 512, {
            fit: "cover",
          })
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
    const reviewBefore = new Date(now.getTime() - SPARK.reviewHours * 60 * 60 * 1000);
    const overdueReviews = await prisma.taskClaim.findMany({
      where: { status: "submitted", submittedAt: { lt: reviewBefore } },
      include: { task: true },
    });
    for (const claim of overdueReviews) {
      await prisma.$transaction(async (tx) => {
        await tx.taskClaim.update({
          where: { id: claim.id },
          data: {
            status: "accepted",
            autoAccepted: true,
            reviewNote: "发起人超时未验收，系统自动通过",
            reviewedAt: now,
          },
        });
        await tx.task.update({
          where: { id: claim.taskId },
          data: { acceptedCount: { increment: 1 }, frozenAmount: { decrement: claim.task.reward } },
        });
        const owner = await tx.sparkAccount.upsert({
          where: { userId: claim.task.ownerId },
          update: {},
          create: { userId: claim.task.ownerId, balance: 0, frozen: 0, lifetimeEarned: 0 },
        });
        const helper = await tx.sparkAccount.upsert({
          where: { userId: claim.userId },
          update: {},
          create: { userId: claim.userId, balance: 0, frozen: 0, lifetimeEarned: 0 },
        });
        const ownerNext = await tx.sparkAccount.update({
          where: { userId: claim.task.ownerId },
          data: {
            balance: owner.balance - claim.task.reward,
            frozen: Math.max(0, owner.frozen - claim.task.reward),
          },
        });
        const helperNext = await tx.sparkAccount.update({
          where: { userId: claim.userId },
          data: {
            balance: helper.balance + claim.task.reward,
            lifetimeEarned: { increment: claim.task.reward },
          },
        });
        await tx.sparkLedger.create({
          data: {
            userId: claim.task.ownerId,
            amount: -claim.task.reward,
            balanceAfter: ownerNext.balance,
            type: "task_unfreeze",
            refType: "claim",
            refId: claim.id,
            memo: `超时自动验收，支付赏金 ${claim.task.reward}`,
          },
        });
        await tx.sparkLedger.create({
          data: {
            userId: claim.userId,
            amount: claim.task.reward,
            balanceAfter: helperNext.balance,
            type: "task_reward",
            refType: "claim",
            refId: claim.id,
            memo: `完成任务「${claim.task.title}」`,
          },
        });
      });
      const helperUser = await prisma.user.findUnique({ where: { id: claim.userId } });
      if (helperUser) {
        const score = Math.min(100, helperUser.creditScore + CREDIT.acceptDelta);
        await prisma.user.update({ where: { id: claim.userId }, data: { creditScore: score } });
      }
      await prisma.notification.create({
        data: {
          userId: claim.userId,
          type: "task_accepted",
          title: "助燃已自动验收通过",
          body: `获得 ${claim.task.reward} 火苗`,
          refType: "claim",
          refId: claim.id,
        },
      });
      if (Math.random() < SPARK.spotCheckRate) {
        await prisma.taskReport.create({
          data: {
            claimId: claim.id,
            reporterId: claim.userId,
            kind: "spot_check",
            reason: "系统抽查已通过的助燃反馈",
          },
        });
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
    if (staleClaims.length || overdueReviews.length || staleTasks.length) {
      console.log(
        `[task.expire] claims=${staleClaims.length} autoAccepted=${overdueReviews.length} tasks=${staleTasks.length}`,
      );
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
