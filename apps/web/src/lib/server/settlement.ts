import { prisma } from "@vibeember/database";
import { CREDIT, SPARK } from "@vibeember/shared";

const SETTLEMENT_KEY = "settlement";
/** 认领窗口：窗口内同一时刻只有一个实例执行结算 */
const SETTLEMENT_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * 任务结算（原 apps/worker 的 task.expire 定时轮询）：
 * 超时领取取消并扣信用分、48h 未验收自动通过并划转赏金、过期任务退还冻结。
 *
 * 触发方式（并存）：
 * - 懒触发：任务/社区读接口顺带执行（runInBackground）
 * - Vercel Cron：每日一次 GET /api/cron/expire（CRON_SECRET 保护）
 * - 长驻模式（dev / Docker）：instrumentation.ts 进程内 setInterval
 */
export class SettlementService {
  /**
   * 原子认领结算窗口后执行。SystemState.updateMany 的条件更新保证多实例/并发请求
   * 不会重复结算（信用分扣减、账本写入不可重放）。
   */
  async runIfDue(minIntervalMs: number = SETTLEMENT_MIN_INTERVAL_MS): Promise<void> {
    const threshold = new Date(Date.now() - minIntervalMs);
    // 行不存在时补建（epoch 时间戳保证下一次即可认领）；常规路径只多一次主键查询
    await prisma.systemState.upsert({
      where: { key: SETTLEMENT_KEY },
      update: {},
      create: { key: SETTLEMENT_KEY, updatedAt: new Date(0) },
    });
    const claimed = await prisma.systemState.updateMany({
      where: { key: SETTLEMENT_KEY, updatedAt: { lt: threshold } },
      data: { updatedAt: new Date() },
    });
    if (claimed.count === 0) return;
    await this.expireDue();
  }

  async expireDue(): Promise<void> {
    const now = new Date();
    const staleClaims = await prisma.taskClaim.findMany({
      where: { status: "claimed", submitBy: { lt: now } },
    });
    for (const claim of staleClaims) {
      await prisma.taskClaim.update({ where: { id: claim.id }, data: { status: "cancelled" } });
      const task = await prisma.task.findUnique({ where: { id: claim.taskId } });
      if (task) {
        const claimedCount = Math.max(0, task.claimedCount - 1);
        await prisma.task.update({
          where: { id: task.id },
          data: {
            claimedCount,
            status: task.status === "full" && claimedCount < task.quota ? "open" : task.status,
          },
        });
      }
      const user = await prisma.user.findUnique({ where: { id: claim.userId } });
      if (user) {
        const score = Math.max(0, user.creditScore + CREDIT.timeoutDelta);
        await prisma.user.update({ where: { id: user.id }, data: { creditScore: score } });
      }
    }
    const reviewBefore = new Date(now.getTime() - SPARK.reviewHours * 60 * 60 * 1000);
    const overdueReviews = await prisma.taskClaim.findMany({
      where: { status: "submitted", submittedAt: { lt: reviewBefore } },
      include: { task: true },
    });
    for (const claim of overdueReviews) {
      await prisma.$transaction(async (tx) => {
        await tx.taskClaim.update({
          where: { id: claim.id },
          data: {
            status: "accepted",
            autoAccepted: true,
            reviewNote: "发起人超时未验收，系统自动通过",
            reviewedAt: now,
          },
        });
        await tx.task.update({
          where: { id: claim.taskId },
          data: { acceptedCount: { increment: 1 }, frozenAmount: { decrement: claim.task.reward } },
        });
        const owner = await tx.sparkAccount.upsert({
          where: { userId: claim.task.ownerId },
          update: {},
          create: { userId: claim.task.ownerId, balance: 0, frozen: 0, lifetimeEarned: 0 },
        });
        const helper = await tx.sparkAccount.upsert({
          where: { userId: claim.userId },
          update: {},
          create: { userId: claim.userId, balance: 0, frozen: 0, lifetimeEarned: 0 },
        });
        const ownerNext = await tx.sparkAccount.update({
          where: { userId: claim.task.ownerId },
          data: {
            balance: owner.balance - claim.task.reward,
            frozen: Math.max(0, owner.frozen - claim.task.reward),
          },
        });
        const helperNext = await tx.sparkAccount.update({
          where: { userId: claim.userId },
          data: {
            balance: helper.balance + claim.task.reward,
            lifetimeEarned: { increment: claim.task.reward },
          },
        });
        await tx.sparkLedger.create({
          data: {
            userId: claim.task.ownerId,
            amount: -claim.task.reward,
            balanceAfter: ownerNext.balance,
            type: "task_unfreeze",
            refType: "claim",
            refId: claim.id,
            memo: `超时自动验收，支付赏金 ${claim.task.reward}`,
          },
        });
        await tx.sparkLedger.create({
          data: {
            userId: claim.userId,
            amount: claim.task.reward,
            balanceAfter: helperNext.balance,
            type: "task_reward",
            refType: "claim",
            refId: claim.id,
            memo: `完成任务「${claim.task.title}」`,
          },
        });
      });
      const helperUser = await prisma.user.findUnique({ where: { id: claim.userId } });
      if (helperUser) {
        const score = Math.min(100, helperUser.creditScore + CREDIT.acceptDelta);
        await prisma.user.update({ where: { id: claim.userId }, data: { creditScore: score } });
      }
      await prisma.notification.create({
        data: {
          userId: claim.userId,
          type: "task_accepted",
          title: "助燃已自动验收通过",
          body: `获得 ${claim.task.reward} 火苗`,
          refType: "claim",
          refId: claim.id,
        },
      });
      if (Math.random() < SPARK.spotCheckRate) {
        await prisma.taskReport.create({
          data: {
            claimId: claim.id,
            reporterId: claim.userId,
            kind: "spot_check",
            reason: "系统抽查已通过的助燃反馈",
          },
        });
      }
    }
    const staleTasks = await prisma.task.findMany({
      where: { status: { in: ["open", "full"] }, deadline: { lt: now } },
    });
    for (const task of staleTasks) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { status: "expired", frozenAmount: 0 },
        });
        if (task.frozenAmount > 0) {
          const account = await tx.sparkAccount.upsert({
            where: { userId: task.ownerId },
            update: {},
            create: { userId: task.ownerId, balance: 0, frozen: 0, lifetimeEarned: 0 },
          });
          const nextFrozen = Math.max(0, account.frozen - task.frozenAmount);
          const updated = await tx.sparkAccount.update({
            where: { userId: task.ownerId },
            data: { frozen: nextFrozen },
          });
          await tx.sparkLedger.create({
            data: {
              userId: task.ownerId,
              amount: 0,
              balanceAfter: updated.balance,
              type: "task_refund",
              refType: "task",
              refId: task.id,
              memo: "任务过期，退回未使用冻结",
            },
          });
        }
      });
    }
    if (staleClaims.length || overdueReviews.length || staleTasks.length) {
      console.log(
        `[settlement] claims=${staleClaims.length} autoAccepted=${overdueReviews.length} tasks=${staleTasks.length}`,
      );
    }
  }
}

export const settlementService = new SettlementService();
