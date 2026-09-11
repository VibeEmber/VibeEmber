import type { Prisma } from "@vibeember/database";
import { prisma } from "@vibeember/database";
import { reviewSchema, type ReviewInput } from "@vibeember/shared";
import { apiRoute, notFound, parseBody, requireAdmin } from "@/lib/server/http";
import { notifyService } from "@/lib/server/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/** 审核：通过 / 驳回（写审核审计记录） */
export const POST = apiRoute<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireAdmin(req);
  const body = await parseBody(req, reviewSchema);
  const reviewedAt = new Date();
  const existing = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const project = await tx.project.findUnique({ where: { id } });
    if (!project) {
      return null;
    }
    await tx.project.update({
      where: { id },
      data: {
        status: body.action,
        rejectionReason: body.action === "rejected" ? body.reason : "",
        reviewerId: user.id,
        approvedAt: body.action === "approved" ? reviewedAt : null,
      },
    });
    await tx.reviewAudit.create({
      data: {
        projectId: id,
        reviewerId: user.id,
        action: body.action,
        reason: body.reason,
      },
    });
    return project;
  });
  if (!existing) {
    throw notFound("产品不存在");
  }
  await notifyService.push({
    userId: existing.ownerId,
    type: body.action === "approved" ? "project_approved" : "project_rejected",
    title: body.action === "approved" ? "你的产品已上线" : "你的产品未通过审核",
    body:
      body.action === "approved"
        ? `${existing.name} 已出现在星火场首页。`
        : `${existing.name}：${body.reason}`,
    refType: "project",
    refId: id,
  });
  return { id, status: (body as ReviewInput).action };
});
