import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
  forcePathStyle: boolean;
}

export function readStorageConfig(): StorageConfig {
  return {
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    region: process.env.S3_REGION ?? "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY ?? "vibe",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "vibeember-secret",
    bucket: process.env.S3_BUCKET ?? "vibeember",
    publicUrl: process.env.S3_PUBLIC_URL ?? "http://localhost:9000/vibeember",
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "1") === "1",
  };
}

export interface Storage {
  /** 生成浏览器直传用的预签名 PUT URL */
  presignPut(key: string, contentType: string, expiresSeconds?: number): Promise<string>;
  putObject(key: string, body: Uint8Array | Buffer, contentType: string): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  /** 对象的公开访问 URL（桶为公共读，或经网关反代） */
  publicUrl(key: string): string;
}

export function createStorage(config: StorageConfig = readStorageConfig()): Storage {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });

  return {
    async presignPut(key, contentType, expiresSeconds = 600) {
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: expiresSeconds },
      );
    },

    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },

    async getObject(key) {
      const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
      const bytes = await response.Body!.transformToByteArray();
      return Buffer.from(bytes);
    },

    publicUrl(key) {
      return `${config.publicUrl.replace(/\/+$/, "")}/${key}`;
    },
  };
}
