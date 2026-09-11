import { prisma } from "@vibeember/database";

export class NotifyService {
  async push(input: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    refType?: string;
    refId?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? "",
        refType: input.refType ?? "",
        refId: input.refId ?? "",
      },
    });
  }

  async list(userId: string) {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = rows.filter((row) => !row.readAt).length;
    return {
      unread,
      notifications: rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        refType: row.refType,
        refId: row.refId,
        readAt: row.readAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async markRead(userId: string, ids?: string[]) {
    await prisma.notification.updateMany({
      where: { userId, ...(ids?.length ? { id: { in: ids } } : { readAt: null }) },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}

export const notifyService = new NotifyService();
