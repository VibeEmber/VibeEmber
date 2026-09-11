import type { NextRequest } from "next/server";
import { prisma } from "@vibeember/database";
import { projectCreateSchema } from "@vibeember/shared";
import { getSessionUser } from "@/lib/server/auth";
import {
  apiRoute,
  badRequest,
  forbidden,
  notFound,
  parseBody,
  requireUser,
} from "@/lib/server/http";
import { afterSave, assetCreates, assertAssetKeys } from "@/lib/server/project-inputs";
import { projectInclude, serializeProject } from "@/lib/server/project-serializer";
import { storage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/** 产品详情（仅公开项目；登录时附带点赞/收藏状态） */
export const GET = apiRoute<Ctx>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const viewer = await getSessionUser(req.headers);
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });
  if (!project || project.status !== "approved") {
    throw notFound("产品不存在或未公开");
  }
  const voted = viewer
    ? Boolean(
        await prisma.projectVote.findUnique({
          where: { userId_projectId: { userId: viewer.id, projectId: id } },
        }),
      )
    : false;
  const bookmarked = viewer
    ? Boolean(
        await prisma.bookmark.findUnique({
          where: { userId_projectId: { userId: viewer.id, projectId: id } },
        }),
      )
    : false;
  return {
    project: serializeProject(project, storage, false, { voted, bookmarked }),
  };
});

export const PATCH = apiRoute<Ctx>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  const body = await parseBody(req, projectCreateSchema);
  assertAssetKeys(user.id, body);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw notFound("产品不存在");
  if (project.ownerId !== user.id) throw forbidden("只能修改自己的产品");
  if (project.status !== "rejected") throw badRequest("只有被驳回的产品可以修改后再投");

  await prisma.$transaction(async (tx) => {
    await tx.projectAsset.deleteMany({ where: { projectId: id } });
    await tx.project.update({
      where: { id },
      data: {
        name: body.name,
        tagline: body.tagline,
        url: body.url ?? "",
        kind: body.kind as never,
        topics: body.topics,
        extras: body.extras ?? {},
        helpNeeded: body.helpNeeded,
        logoKey: body.logoKey ?? null,
        status: "pending",
        rejectionReason: "",
        reviewerId: null,
        approvedAt: null,
        assets: { create: assetCreates(body) },
      },
    });
  });
  await afterSave(id, body);
  return { id, status: "pending" };
});
