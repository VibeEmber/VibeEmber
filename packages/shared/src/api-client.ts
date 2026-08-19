import type { UploadKind } from "./constants.js";
import type {
  ClaimReviewInput,
  ClaimSubmitInput,
  MeUpdateInput,
  PresignInput,
  ProjectCreateInput,
  ReviewInput,
  TaskCreateInput,
} from "./schemas.js";
import type {
  CommentItem,
  CommunityWeek,
  NotificationItem,
  ProjectPrivate,
  ProjectPublic,
  ProjectStatus,
  PublicProfile,
  SessionUser,
  SparkLedgerItem,
  SparkSummary,
  TaskClaimItem,
  TaskPublic,
  TaskReportItem,
} from "./types.js";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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
  if (!response.ok) throw new ApiError(data?.error || "请求失败，请稍后重试", response.status);
  return data;
}

export const api = {
  health: () => apiFetch<{ ok: boolean; service: string }>("/api/health"),
  listProjects: () => apiFetch<{ projects: ProjectPublic[] }>("/api/projects"),
  getProject: (id: string) => apiFetch<{ project: ProjectPublic }>(`/api/projects/${id}`),
  createProject: (input: ProjectCreateInput) =>
    apiFetch<{ id: string; status: ProjectStatus }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  myProjects: () => apiFetch<{ projects: ProjectPrivate[] }>("/api/projects/mine"),
  adminProjects: (status: ProjectStatus) =>
    apiFetch<{ projects: ProjectPrivate[] }>(`/api/admin/projects?status=${status}`),
  reviewProject: (id: string, input: ReviewInput) =>
    apiFetch<{ id: string; status: ProjectStatus }>(`/api/admin/projects/${id}/review`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  presignUpload: (input: PresignInput) =>
    apiFetch<{ key: string; url: string; publicUrl: string }>("/api/uploads/presign", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateMe: (input: MeUpdateInput) =>
    apiFetch<{ user: SessionUser }>("/api/me", { method: "PATCH", body: JSON.stringify(input) }),
  sparks: () => apiFetch<SparkSummary>("/api/me/sparks"),
  ledger: () => apiFetch<SparkLedgerItem[]>("/api/me/ledger"),
  myClaims: () => apiFetch<TaskClaimItem[]>("/api/me/claims"),
  pendingReviews: () => apiFetch<TaskClaimItem[]>("/api/me/reviews"),
  communityWeek: () => apiFetch<CommunityWeek>("/api/community/week"),
  listTasks: () => apiFetch<TaskPublic[]>("/api/tasks"),
  createTask: (input: TaskCreateInput) =>
    apiFetch<{ id: string; status: string }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  claimTask: (id: string) =>
    apiFetch<{ id: string; status: string; submitBy: string }>(`/api/tasks/${id}/claim`, {
      method: "POST",
    }),
  submitClaim: (id: string, input: ClaimSubmitInput) =>
    apiFetch<{ ok: boolean }>(`/api/claims/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  cancelClaim: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/claims/${id}/cancel`, { method: "POST" }),
  reviewClaim: (id: string, input: ClaimReviewInput) =>
    apiFetch<{ status: string }>(`/api/claims/${id}/review`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  reportClaim: (id: string, reason: string) =>
    apiFetch<{ id: string }>(`/api/claims/${id}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  comments: (projectId: string) =>
    apiFetch<{ comments: CommentItem[] }>(`/api/projects/${projectId}/comments`),
  addComment: (projectId: string, body: string) =>
    apiFetch<{ id: string }>(`/api/projects/${projectId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  toggleBookmark: (projectId: string) =>
    apiFetch<{ bookmarked: boolean }>(`/api/projects/${projectId}/bookmark`, { method: "POST" }),
  toggleVote: (projectId: string) =>
    apiFetch<{ voted: boolean }>(`/api/projects/${projectId}/vote`, { method: "POST" }),
  notifications: () =>
    apiFetch<{ unread: number; notifications: NotificationItem[] }>("/api/notifications"),
  readNotifications: (ids?: string[]) =>
    apiFetch<{ ok: boolean }>("/api/notifications/read", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
  profile: (id: string) => apiFetch<PublicProfile>(`/api/users/${id}`),
  adminReports: () => apiFetch<{ reports: TaskReportItem[] }>("/api/admin/reports"),
  resolveReport: (id: string, action: "upheld" | "dismissed", resolution: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/reports/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action, resolution }),
    }),
};

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
  if (!response.ok) throw new ApiError("图片上传失败，请重试", response.status);
  return { key, publicUrl };
}
