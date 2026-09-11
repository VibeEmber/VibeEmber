import { randomUUID } from "node:crypto";
import { CONTENT_TYPE_EXT, UPLOAD_PREFIX, presignSchema } from "@vibeember/shared";
import { apiRoute, parseBody, requireUser } from "@/lib/server/http";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (req) => {
  const user = await requireUser(req);
  const body = await parseBody(req, presignSchema);
  const prefix = UPLOAD_PREFIX[body.kind];
  const key = `${prefix}/${user.id}-${randomUUID().slice(0, 8)}${CONTENT_TYPE_EXT[body.contentType]}`;
  const url = await storage.presignPut(key, body.contentType);
  return { key, url, publicUrl: storage.publicUrl(key) };
});
