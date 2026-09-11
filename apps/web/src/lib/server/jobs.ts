import { waitUntil } from "@vercel/functions";
import QRCode from "qrcode";
import sharp from "sharp";
import type { Storage } from "@vibeember/storage";
import { storage } from "./storage";

/**
 * 请求内后台执行：不阻塞响应。
 * Vercel 函数内用 waitUntil 把 Promise 的生命周期延长到响应之后（Fluid Compute）；
 * 长驻进程（dev / Docker）直接 fire-and-forget，事件循环天然继续运行。
 */
export function runInBackground(task: Promise<void>): void {
  const guarded = task.catch((error) => console.error("[background] 后台任务失败：", error));
  if (process.env.VERCEL) {
    waitUntil(guarded);
  } else {
    void guarded;
  }
}

export type ImageKind = "avatar" | "logo" | "screenshot";

/**
 * 媒体加工（原 apps/worker 的 qr.generate / image.process 队列消费者）。
 * Serverless 环境无常驻 worker，任务在触发请求内以后台方式执行。
 */
export class JobsService {
  constructor(private readonly storage: Storage) {}

  /** 生成产品链接二维码 PNG 并上传 S3 */
  generateQr(projectId: string, url: string, qrKey: string): void {
    runInBackground(this.doGenerateQr(projectId, url, qrKey));
  }

  /** 头像/Logo 压成方形；产品截图只限制长边，避免证据被裁切 */
  processImage(key: string, kind: ImageKind): void {
    runInBackground(this.doProcessImage(key, kind));
  }

  private async doGenerateQr(projectId: string, url: string, qrKey: string): Promise<void> {
    try {
      const png = await QRCode.toBuffer(url, {
        width: 512,
        margin: 2,
        color: { dark: "#171814", light: "#ffffff" },
      });
      await this.storage.putObject(qrKey, png, "image/png");
    } catch (error) {
      console.error(`[jobs] 项目 ${projectId} 二维码生成失败：`, error);
      throw error;
    }
  }

  private async doProcessImage(key: string, kind: ImageKind): Promise<void> {
    try {
      const original = await this.storage.getObject(key);
      const pipeline = sharp(original);
      const processed =
        kind === "screenshot"
          ? await pipeline
              .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 85 })
              .toBuffer()
          : await pipeline
              .resize(kind === "avatar" ? 256 : 512, kind === "avatar" ? 256 : 512, {
                fit: "cover",
              })
              .webp({ quality: 85 })
              .toBuffer();
      await this.storage.putObject(key, processed, "image/webp");
    } catch (error) {
      console.error(`[jobs] 图片处理失败（${kind} ${key}）：`, error);
      throw error;
    }
  }
}

export const jobsService = new JobsService(storage);
