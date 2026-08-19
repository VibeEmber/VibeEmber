import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma, SparkType } from "@vibeember/database";
import { SPARK } from "@vibeember/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SparkService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureAccount(userId: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.sparkAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, frozen: 0, lifetimeEarned: 0 },
    });
  }

  async getSummary(userId: string) {
    const account = await this.ensureAccount(userId);
    return {
      balance: account.balance,
      frozen: account.frozen,
      available: account.balance - account.frozen,
      lifetimeEarned: account.lifetimeEarned,
    };
  }

  async grantSignupBonus(userId: string) {
    const existing = await this.prisma.sparkLedger.findFirst({
      where: { userId, type: "signup_bonus" },
    });
    if (existing) return;
    await this.apply({
      userId,
      amount: SPARK.signupBonus,
      type: "signup_bonus",
      memo: "注册赠送火苗",
    });
  }

  async apply(input: {
    userId: string;
    amount: number;
    type: SparkType;
    refType?: string;
    refId?: string;
    memo: string;
    freezeDelta?: number;
  }) {
    return this.prisma.$transaction((tx) => this.applyIn(tx, input));
  }

  async applyIn(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      amount: number;
      type: SparkType;
      refType?: string;
      refId?: string;
      memo: string;
      freezeDelta?: number;
    },
  ) {
    const account = await this.ensureAccount(input.userId, tx);
    const nextBalance = account.balance + input.amount;
    const nextFrozen = account.frozen + (input.freezeDelta ?? 0);
    if (nextBalance < 0 || nextFrozen < 0 || nextBalance - nextFrozen < 0) {
      throw new BadRequestException("火苗余额不足");
    }
    const updated = await tx.sparkAccount.update({
      where: { userId: input.userId },
      data: {
        balance: nextBalance,
        frozen: nextFrozen,
        lifetimeEarned: input.amount > 0 ? { increment: input.amount } : undefined,
      },
    });
    await tx.sparkLedger.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        balanceAfter: updated.balance,
        type: input.type,
        refType: input.refType ?? "",
        refId: input.refId ?? "",
        memo: input.memo,
      },
    });
    return updated;
  }

  async listLedger(userId: string, take = 50) {
    const rows = await this.prisma.sparkLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map((row) => ({
      id: row.id,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      type: row.type,
      memo: row.memo,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
