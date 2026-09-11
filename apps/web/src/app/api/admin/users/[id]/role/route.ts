import { prisma } from "@vibeember/database";
import { roleUpdateSchema } from "@vibeember/shared";
import { apiRoute, badRequest, notFound, parseBody, requireAdmin } from "@/lib/server/http";
import { notifyService } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 设置用户角色（管理员专用）。
 * 护栏：不能修改自己的角色——保证社区始终至少保留当前操作的管理员。
 */
export const PATCH = apiRoute<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const admin = await requireAdmin(req);
  const body = await parseBody(req, roleUpdateSchema);
  if (id === admin.id) {
    throw badRequest("不能修改自己的角色");
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw notFound("用户不存在");
  if (target.role === body.role) {
    return { id, role: body.role };
  }
  await prisma.user.update({ where: { id }, data: { role: body.role } });
  await notifyService.push({
    userId: id,
    type: "role_changed",
    title: body.role === "admin" ? "你已被设为管理员" : "管理员身份已移除",
    body:
      body.role === "admin"
        ? "现在可以在个人中心使用审核与管理功能。"
        : "如有疑问请联系社区管理员。",
    refType: "user",
    refId: admin.id,
  });
  return { id, role: body.role };
});
