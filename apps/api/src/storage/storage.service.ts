import { Injectable } from "@nestjs/common";
import { createStorage, type Storage } from "@vibeember/storage";

/** S3(MinIO) 访问的 Nest 包装：头像 / 产品 Logo / 产品二维码 */
@Injectable()
export class StorageService implements Pick<Storage, "presignPut" | "publicUrl"> {
  private readonly storage = createStorage();

  presignPut(key: string, contentType: string): Promise<string> {
    return this.storage.presignPut(key, contentType);
  }

  publicUrl(key: string): string {
    return this.storage.publicUrl(key);
  }
}
