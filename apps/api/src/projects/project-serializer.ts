import type { Prisma } from "@vibeember/database";
import type { ProjectPrivate, ProjectPublic } from "@vibeember/shared";
import type { StorageService } from "../storage/storage.service";

export type ProjectWithOwner = Prisma.ProjectGetPayload<{
  include: { owner: { select: { name: true; email: true; image: true } } };
}>;

/** DB 行 -> API JSON（camelCase 契约与旧版前端保持一致，新增图片 URL 字段） */
export function serializeProject(
  project: ProjectWithOwner,
  storage: StorageService,
  includePrivate = false,
): ProjectPublic | ProjectPrivate {
  const data: ProjectPublic = {
    id: project.id,
    name: project.name,
    tagline: project.tagline,
    url: project.url,
    category: project.category,
    helpNeeded: project.helpNeeded,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    maker: project.owner.name,
    makerAvatarUrl: project.owner.image,
    logoUrl: project.logoKey ? storage.publicUrl(project.logoKey) : null,
    qrUrl: project.qrKey ? storage.publicUrl(project.qrKey) : null,
  };
  if (!includePrivate) {
    return data;
  }
  return { ...data, ownerEmail: project.owner.email, rejectionReason: project.rejectionReason };
}
