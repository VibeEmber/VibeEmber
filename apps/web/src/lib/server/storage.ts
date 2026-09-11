import { createStorage, type Storage } from "@vibeember/storage";

/** S3(MinIO) 访问：头像 / 产品 Logo / 截图 / 产品二维码 */
export const storage: Storage = createStorage();
