import { loadEnv } from "./env.js";

loadEnv();

import pgBossDefault, { type Job } from "pg-boss";
import QRCode from "qrcode";
import sharp from "sharp";
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

  console.log("VibeEmber worker 已启动（qr.generate / image.process）");

  const shutdown = async (signal: string) => {
    console.log(`收到 ${signal}，正在优雅退出…`);
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
