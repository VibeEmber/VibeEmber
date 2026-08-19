import type { ProjectKind } from "./constants.js";

export type UserRole = "member" | "admin";

export type ProjectStatus = "pending" | "approved" | "rejected";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
}

export interface ProjectPublic {
  id: string;
  name: string;
  tagline: string;
  url: string;
  kind: ProjectKind;
  kindLabel: string;
  topics: string[];
  extras: Record<string, unknown>;
  helpNeeded: string;
  status: ProjectStatus;
  createdAt: string;
  maker: string;
  makerId: string;
  makerAvatarUrl: string | null;
  logoUrl: string | null;
  qrUrl: string | null;
  extraQrUrl: string | null;
  screenshotUrls: string[];
  commentCount: number;
  voteCount: number;
  bookmarkCount: number;
  voted?: boolean;
  bookmarked?: boolean;
}

export interface ProjectPrivate extends ProjectPublic {
  ownerEmail: string;
  rejectionReason: string;
}

export interface SparkSummary {
  balance: number;
  frozen: number;
  available: number;
  lifetimeEarned: number;
}

export interface SparkLedgerItem {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  typeLabel: string;
  memo: string;
  createdAt: string;
}

export interface TaskPublic {
  id: string;
  projectId: string;
  projectName: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  feedbackType: string;
  feedbackTypeLabel: string;
  checklist: string[];
  questions: string[];
  allowPublicSnippet: boolean;
  reward: number;
  quota: number;
  claimedCount: number;
  acceptedCount: number;
  status: string;
  deadline: string;
  createdAt: string;
}

export interface TaskClaimItem {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  status: string;
  feedback: string;
  answers: string[];
  questions: string[];
  checklist: string[];
  feedbackType: string;
  screenshotUrl: string | null;
  reviewNote: string;
  autoAccepted: boolean;
  claimedAt: string;
  submitBy: string;
  submittedAt: string | null;
}

export interface CommunityWeek {
  memberCount: number;
  acceptedCount: number;
  helpedProjectCount: number;
  helperCount: number;
  invitedUserCount: number;
  cases: Array<{
    projectId: string;
    projectName: string;
    acceptedCount: number;
    snippet: string | null;
  }>;
  helpers: Array<{
    userId: string;
    name: string;
    acceptedCount: number;
  }>;
  recent: Array<{
    helperName: string;
    projectName: string;
    feedbackTypeLabel: string;
    createdAt: string;
  }>;
}

export interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  body: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  refType: string;
  refId: string;
  readAt: string | null;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string;
  creditBand: string;
  creditScore: number;
  projectCount: number;
  helpCount: number;
  lifetimeEarned: number;
  projects: ProjectPublic[];
}

export interface TaskReportItem {
  id: string;
  claimId: string;
  taskTitle: string;
  reason: string;
  kind: string;
  status: string;
  reporterName: string;
  createdAt: string;
}
