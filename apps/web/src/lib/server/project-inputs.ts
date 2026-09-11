import { prisma } from "@vibeember/database";
import type { ProjectCreateData } from "@vibeember/shared";
import { badRequest } from "./http";
import { jobsService } from "./jobs";

export function assertAssetKeys(userId: string, body: ProjectCreateData) {
  if (body.logoKey && !body.logoKey.startsWith(`logos/${userId}-`)) {
    throw badRequest("Logo 文件无效");
  }
  for (const key of body.screenshotKeys ?? []) {
    if (!key.startsWith(`screenshots/${userId}-`)) throw badRequest("截图文件无效");
  }
  if (body.extraQrKey && !body.extraQrKey.startsWith(`qrs/${userId}-`)) {
    throw badRequest("二维码文件无效");
  }
}

export function assetCreates(body: ProjectCreateData) {
  return [
    ...(body.screenshotKeys ?? []).map((key, index) => ({
      kind: "screenshot" as const,
      key,
      sort: index,
    })),
    ...(body.extraQrKey ? [{ kind: "qr" as const, key: body.extraQrKey, sort: 0 }] : []),
  ];
}

export async function afterSave(projectId: string, body: ProjectCreateData) {
  if (body.url) {
    const qrKey = `qr/${projectId}.png`;
    await prisma.project.update({ where: { id: projectId }, data: { qrKey } });
    jobsService.generateQr(projectId, body.url, qrKey);
  }
  if (body.logoKey) jobsService.processImage(body.logoKey, "logo");
  for (const key of body.screenshotKeys ?? []) {
    jobsService.processImage(key, "screenshot");
  }
  if (body.extraQrKey) {
    jobsService.processImage(body.extraQrKey, "logo");
  }
}
