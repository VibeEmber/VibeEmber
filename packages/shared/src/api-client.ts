import type { UploadKind } from "./constants.js";
import type { MeUpdateInput, PresignInput, ProjectCreateInput, ReviewInput } from "./schemas.js";
import type { ProjectPrivate, ProjectPublic, ProjectStatus, SessionUser } from "./types.js";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** 同源 API 请求：/api 前缀，凭据随行，错误统一抛 {error} 文案 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("/api") ? path : `/api${path}`;
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new ApiError(data?.error || "请求失败，请稍后重试", response.status);
  }
  return data;
}

export const api = {
  health: () => apiFetch<{ ok: boolean; service: string }>("/api/health"),

  listProjects: () => apiFetch<{ projects: ProjectPublic[] }>("/api/projects"),

  createProject: (input: ProjectCreateInput) =>
    apiFetch<{ id: string; status: ProjectStatus }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  myProjects: () => apiFetch<{ projects: ProjectPrivate[] }>("/api/projects/mine"),

  adminProjects: (status: ProjectStatus) =>
    apiFetch<{ projects: ProjectPrivate[] }>(`/api/admin/projects?status=${status}`),

  reviewProject: (id: string, input: ReviewInput) =>
    apiFetch<{ id: string; status: ProjectStatus }>(`/api/admin/projects/$glm-5.3_common/review`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  presignUpload: (input: PresignInput) =>
    apiFetch<{ key: string; url: string; publicUrl: string }>("/api/uploads/presign", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateMe: (input: MeUpdateInput) =>
    apiFetch<{ user: SessionUser }>("/api/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};

/**
 * 图片上传三步流：向 API 取预签名 URL -> 浏览器直传 S3/MinIO -> 返回对象 key。
 * 仅可在浏览器端调用。
 */
export async function uploadFile(
  kind: UploadKind,
  file: File,
): Promise<{ key: string; publicUrl: string }> {
  const { key, url, publicUrl } = await api.presignUpload({ kind, contentType: file.type });
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new ApiError("图片上传失败，请重试", response.status);
  }
  return { key, publicUrl };
}
