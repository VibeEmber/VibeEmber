import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { creditBand } from "@vibeember/shared";
import { PrismaService } from "../prisma/prisma.service";
import { serializeProject } from "../projects/project-serializer";
import { StorageService } from "../storage/storage.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get(":id")
  async profile(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        sparkAccount: true,
        projects: {
          where: { status: "approved" },
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
            assets: true,
            _count: { select: { comments: true, votes: true, bookmarks: true } },
          },
          orderBy: { approvedAt: "desc" },
        },
      },
    });
    if (!user) throw new NotFoundException("用户不存在");
    const helpCount = await this.prisma.taskClaim.count({
      where: { userId: id, status: "accepted" },
    });
    return {
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      creditBand: creditBand(user.creditScore),
      creditScore: user.creditScore,
      projectCount: user.projects.length,
      helpCount,
      lifetimeEarned: user.sparkAccount?.lifetimeEarned ?? 0,
      projects: user.projects.map((project) => serializeProject(project, this.storage)),
    };
  }
}
