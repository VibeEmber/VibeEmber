import { prisma } from "@vibeember/database";
import { apiRoute, requireAdmin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** 用户管理：按昵称/邮箱搜索（管理员专用） */
export const GET = apiRoute(async (req) => {
  await requireAdmin(req);
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const rows = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
  return {
    users: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      role: row.role === "admin" ? "admin" : "member",
      createdAt: row.createdAt.toISOString(),
    })),
  };
});
