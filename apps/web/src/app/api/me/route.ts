import type { Prisma } from "@vibeember/database";
import { prisma } from "@vibeember/database";
import { meUpdateSchema } from "@vibeember/shared";
import { apiRoute, badRequest, parseBody, requireUser } from "@/lib/server/http";
import { jobsService } from "@/lib/server/jobs";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const PATCH = apiRoute(async (req) => {
  const user = await requireUser(req);
  const body = await parseBody(req, meUpdateSchema);
  if (body.avatarKey && !body.avatarKey.startsWith(`avatars/${user.id}-`)) {
    throw badRequest("头像文件无效");
  }
  const data: Prisma.UserUpdateInput = {};
  if (body.name) data.name = body.name;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.avatarKey) data.image = storage.publicUrl(body.avatarKey);
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  if (body.avatarKey) {
    jobsService.processImage(body.avatarKey, "avatar");
  }
  return {
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      image: updated.image,
      role: updated.role === "admin" ? "admin" : "member",
      bio: updated.bio,
    },
  };
});
