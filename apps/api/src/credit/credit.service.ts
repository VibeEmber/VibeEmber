import { BadRequestException, Injectable } from "@nestjs/common";
import { CREDIT } from "@vibeember/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  async adjust(userId: string, delta: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const score = Math.max(0, Math.min(100, user.creditScore + delta));
    const creditFrozenUntil =
      score < CREDIT.freezeBelow
        ? new Date(Date.now() + CREDIT.freezeDays * 24 * 60 * 60 * 1000)
        : null;
    return this.prisma.user.update({
      where: { id: userId },
      data: { creditScore: score, creditFrozenUntil },
    });
  }

  async assertCanClaim(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("用户不存在");
    if (user.creditFrozenUntil && user.creditFrozenUntil > new Date()) {
      throw new BadRequestException("信用过低，暂时不能领取任务");
    }
    if (user.creditScore < CREDIT.minClaim) {
      throw new BadRequestException("信用不足，先去完成已领取的任务");
    }
    const open = await this.prisma.taskClaim.count({
      where: { userId, status: { in: ["claimed", "submitted"] } },
    });
    if (open >= CREDIT.maxOpenClaims) {
      throw new BadRequestException("还有未完成的领取，先去提交或取消");
    }
  }
}
