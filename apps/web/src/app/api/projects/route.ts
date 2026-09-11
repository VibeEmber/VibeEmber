import type { NextRequest } from "next/server";
import { prisma } from "@vibeember/database";
import { projectCreateSchema, type ProjectPublic } from "@vibeember/shared";
import { getSessionUser } from "@/lib/server/auth";
import { apiRoute, parseBody, requireUser } from "@/lib/server/http";
import { afterSave, assetCreates, assertAssetKeys } from "@/lib/server/project-inputs";
import { projectInclude, serializeProject } from "@/lib/server/project-serializer";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = apiRoute(async (req: NextRequest) => {
  const viewer = await getSessionUser(req.headers);
  const rows = await prisma.project.findMany({
    where: { status: "approved" },
    orderBy: { approvedAt: "desc" },
    take: 100,
    include: projectInclude,
  });
  const votes = viewer
    ? await prisma.projectVote.findMany({
        where: { userId: viewer.id, projectId: { in: rows.map((row) => row.id) } },
      })
    : [];
  const bookmarks = viewer
    ? await prisma.bookmark.findMany({
        where: { userId: viewer.id, projectId: { in: rows.map((row) => row.id) } },
      })
    : [];
  const voted = new Set(votes.map((item) => item.projectId));
  const bookmarked = new Set(bookmarks.map((item) => item.projectId));
  return {
    projects: rows.map((row) =>
      serializeProject(row, storage, false, {
        voted: voted.has(row.id),
        bookmarked: bookmarked.has(row.id),
      }),
    ) as ProjectPublic[],
  };
});

export const POST = apiRoute(async (req: NextRequest) => {
  const user = await requireUser(req);
  const body = await parseBody(req, projectCreateSchema);
  assertAssetKeys(user.id, body);
  const created = await prisma.project.create({
    data: {
      ownerId: user.id,
      name: body.name,
      tagline: body.tagline,
      url: body.url ?? "",
      kind: body.kind as never,
      topics: body.topics,
      extras: body.extras ?? {},
      helpNeeded: body.helpNeeded,
      logoKey: body.logoKey ?? null,
      assets: { create: assetCreates(body) },
    },
  });
  await afterSave(created.id, body);
  return { id: created.id, status: "pending" };
});
