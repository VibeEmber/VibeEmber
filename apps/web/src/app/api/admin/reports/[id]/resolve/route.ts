import { prisma } from "@vibeember/database";
import { CREDIT, reportResolveSchema } from "@vibeember/shared";
import { creditService } from "@/lib/server/credit";
import { apiRoute, notFound, parseBody, requireAdmin } from "@/lib/server/http";
import { notifyService } from "@/lib/server/notify";
import { sparkService } from "@/lib/server/spark";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiRoute<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireAdmin(req);
  const body = await parseBody(req, reportResolveSchema);
  const report = await prisma.taskReport.findUnique({
    include: { claim: { include: { task: true } } },
    where: { id },
  });
  if (!report || report.status !== "pending") throw notFound("举报不存在或已处理");
  await prisma.taskReport.update({
    where: { id },
    data: {
      status: body.action,
      resolverId: user.id,
      resolution: body.resolution,
      resolvedAt: new Date(),
    },
  });
  const reward = report.claim.task.reward;
  if (
    body.action === "upheld" &&
    report.kind !== "spot_check" &&
    report.claim.status === "rejected"
  ) {
    const stillFrozen = report.claim.task.frozenAmount >= reward;
    await prisma.$transaction(async (tx) => {
      await tx.taskClaim.update({
        where: { id: report.claimId },
        data: {
          status: "accepted",
          reviewNote: `管理员改判：${body.resolution}`,
          reviewedAt: new Date(),
        },
      });
      await tx.task.update({
        where: { id: report.claim.taskId },
        data: {
          acceptedCount: { increment: 1 },
          ...(stillFrozen ? { frozenAmount: { decrement: reward } } : {}),
        },
      });
      await sparkService.applyIn(tx, {
        userId: report.claim.task.ownerId,
        amount: -reward,
        freezeDelta: stillFrozen ? -reward : 0,
        type: stillFrozen ? "task_unfreeze" : "admin_adjust",
        refType: "report",
        refId: report.id,
        memo: stillFrozen ? "举报成立，从冻结款支付赏金" : "举报成立，从发起人可用火苗支付赏金",
      });
      await sparkService.applyIn(tx, {
        userId: report.claim.userId,
        amount: reward,
        type: "admin_adjust",
        refType: "report",
        refId: report.id,
        memo: "举报成立，补发任务赏金",
      });
    });
    await creditService.adjust(report.claim.task.ownerId, CREDIT.reportUpheldOwnerDelta);
    await notifyService.push({
      userId: report.claim.userId,
      type: "report_upheld",
      title: "你的举报成立，火苗已补发",
      refType: "claim",
      refId: report.claimId,
    });
    await notifyService.push({
      userId: report.claim.task.ownerId,
      type: "report_upheld_owner",
      title: "助燃举报成立，已从你的火苗支付赏金",
      body: report.claim.task.title,
      refType: "claim",
      refId: report.claimId,
    });
  }
  if (
    body.action === "upheld" &&
    report.kind === "spot_check" &&
    report.claim.status === "accepted"
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.taskClaim.update({
        where: { id: report.claimId },
        data: {
          status: "rejected",
          reviewNote: `抽查未通过：${body.resolution}`,
          reviewedAt: new Date(),
        },
      });
      await tx.task.update({
        where: { id: report.claim.taskId },
        data: { acceptedCount: { decrement: 1 } },
      });
      await sparkService.applyIn(tx, {
        userId: report.claim.userId,
        amount: -reward,
        type: "admin_adjust",
        refType: "report",
        refId: report.id,
        memo: "抽查未通过，追回任务赏金",
      });
      await sparkService.applyIn(tx, {
        userId: report.claim.task.ownerId,
        amount: reward,
        type: "admin_adjust",
        refType: "report",
        refId: report.id,
        memo: "抽查追回，退回已支付赏金",
      });
    });
    await creditService.adjust(report.claim.userId, CREDIT.rejectDelta);
    await notifyService.push({
      userId: report.claim.userId,
      type: "spot_check_upheld",
      title: "抽查未通过，火苗已追回",
      body: body.resolution,
      refType: "claim",
      refId: report.claimId,
    });
  }
  return { ok: true };
});
