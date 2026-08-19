import type { Prisma } from "@vibeember/database";
import {
  PROJECT_KIND_LABELS,
  type ProjectKind,
  type ProjectPrivate,
  type ProjectPublic,
} from "@vibeember/shared";
import type { StorageService } from "../storage/storage.service";

export type ProjectWithOwner = Prisma.ProjectGetPayload<{
  include: {
    owner: { select: { id: true; name: true; email: true; image: true } };
    assets: true;
    _count: { select: { comments: true; votes: true; bookmarks: true } };
  };
}>;

export function serializeProject(
  project: ProjectWithOwner,
  storage: StorageService,
  includePrivate = false,
  flags?: { voted?: boolean; bookmarked?: boolean },
): ProjectPublic | ProjectPrivate {
  const extraQr = project.assets.find((asset) => asset.kind === "qr");
  const screenshots = project.assets
    .filter((asset) => asset.kind === "screenshot")
    .sort((a, b) => a.sort - b.sort);
  const data: ProjectPublic = {
    id: project.id,
    name: project.name,
    tagline: project.tagline,
    url: project.url,
    kind: project.kind,
    kindLabel: PROJECT_KIND_LABELS[project.kind as ProjectKind] ?? project.kind,
    topics: project.topics,
    extras: (project.extras as Record<string, unknown>) ?? {},
    helpNeeded: project.helpNeeded,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    maker: project.owner.name,
    makerId: project.owner.id,
    makerAvatarUrl: project.owner.image,
    logoUrl: project.logoKey ? storage.publicUrl(project.logoKey) : null,
    qrUrl: project.qrKey
      ? storage.publicUrl(project.qrKey)
      : extraQr
        ? storage.publicUrl(extraQr.key)
        : null,
    extraQrUrl: extraQr ? storage.publicUrl(extraQr.key) : null,
    screenshotUrls: screenshots.map((item) => storage.publicUrl(item.key)),
    commentCount: project._count?.comments ?? 0,
    voteCount: project._count?.votes ?? 0,
    bookmarkCount: project._count?.bookmarks ?? 0,
    voted: flags?.voted,
    bookmarked: flags?.bookmarked,
  };
  if (!includePrivate) return data;
  return { ...data, ownerEmail: project.owner.email, rejectionReason: project.rejectionReason };
}

export const projectInclude = {
  owner: { select: { id: true, name: true, email: true, image: true } },
  assets: true,
  _count: { select: { comments: true, votes: true, bookmarks: true } },
} satisfies Prisma.ProjectInclude;
