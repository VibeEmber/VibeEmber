export type UserRole = "member" | "admin";

export type ProjectStatus = "pending" | "approved" | "rejected";

/** 会话用户（Better-Auth session user + role 附加字段） */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
}

/** 公开项目（GET /api/projects） */
export interface ProjectPublic {
  id: string;
  name: string;
  tagline: string;
  url: string;
  category: string;
  helpNeeded: string;
  status: ProjectStatus;
  createdAt: string;
  maker: string;
  makerAvatarUrl: string | null;
  logoUrl: string | null;
  qrUrl: string | null;
}

/** 私有项目（我的投稿 / 管理员队列） */
export interface ProjectPrivate extends ProjectPublic {
  ownerEmail: string;
  rejectionReason: string;
}
