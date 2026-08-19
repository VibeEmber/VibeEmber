import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  CONTENT_TYPE_EXT,
  UPLOAD_PREFIX,
  presignSchema,
  type PresignInput,
  type SessionUser,
} from "@vibeember/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { StorageService } from "../storage/storage.service";

@Controller("uploads")
@UseGuards(SessionGuard)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post("presign")
  async presign(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(presignSchema)) body: PresignInput,
  ): Promise<{ key: string; url: string; publicUrl: string }> {
    const prefix = UPLOAD_PREFIX[body.kind];
    const key = `${prefix}/${user.id}-${randomUUID().slice(0, 8)}${CONTENT_TYPE_EXT[body.contentType]}`;
    const url = await this.storage.presignPut(key, body.contentType);
    return { key, url, publicUrl: this.storage.publicUrl(key) };
  }
}
