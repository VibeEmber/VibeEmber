import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  CONTENT_TYPE_EXT,
  presignSchema,
  type PresignInput,
  type SessionUser,
} from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { StorageService } from "../storage/storage.service";

/**
 * 预签名直传：API 只签发 URL，文件由浏览器直传 S3/MinIO。
 * 键位规则：{avatars|logos}/{userId}-{rand}{ext}，提交时校验归属前缀。
 */
@Controller("uploads")
@UseGuards(SessionGuard)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post("presign")
  async presign(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(presignSchema)) body: PresignInput,
  ): Promise<{ key: string; url: string; publicUrl: string }> {
    const prefix = body.kind === "avatar" ? "avatars" : "logos";
    const key = `${prefix}/${user.id}-${randomUUID().slice(0, 8)}${CONTENT_TYPE_EXT[body.contentType]}`;
    const url = await this.storage.presignPut(key, body.contentType);
    return { key, url, publicUrl: this.storage.publicUrl(key) };
  }
}
