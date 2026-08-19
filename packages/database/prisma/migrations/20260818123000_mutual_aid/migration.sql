-- CreateEnum
CREATE TYPE "ProjectKind" AS ENUM ('web', 'mini_program', 'mobile_app', 'desktop', 'social');
CREATE TYPE "AssetKind" AS ENUM ('screenshot', 'qr');
CREATE TYPE "TaskStatus" AS ENUM ('open', 'full', 'closed', 'expired');
CREATE TYPE "ClaimStatus" AS ENUM ('claimed', 'submitted', 'accepted', 'rejected', 'cancelled');
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'upheld', 'dismissed');
CREATE TYPE "SparkType" AS ENUM ('signup_bonus', 'task_freeze', 'task_unfreeze', 'task_reward', 'task_refund', 'admin_adjust');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "bio" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "creditScore" INTEGER NOT NULL DEFAULT 70;
ALTER TABLE "User" ADD COLUMN "creditFrozenUntil" TIMESTAMP(3);

-- AlterTable Project
ALTER TABLE "Project" ADD COLUMN "kind" "ProjectKind" NOT NULL DEFAULT 'web';
ALTER TABLE "Project" ADD COLUMN "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Project" ADD COLUMN "extras" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Project" ALTER COLUMN "url" SET DEFAULT '';

UPDATE "Project" SET
  "kind" = CASE "category"
    WHEN '微信小程序' THEN 'mini_program'::"ProjectKind"
    WHEN '移动 App' THEN 'mobile_app'::"ProjectKind"
    WHEN '浏览器插件' THEN 'desktop'::"ProjectKind"
    ELSE 'web'::"ProjectKind"
  END,
  "topics" = CASE
    WHEN "category" IN ('教育', '生活方式', '其他') THEN ARRAY["category"]
    WHEN "category" = 'AI 工具' THEN ARRAY['AI']
    WHEN "category" IN ('Web 应用', '微信小程序', '移动 App', '浏览器插件') THEN ARRAY['工具']
    ELSE ARRAY['其他']
  END;

ALTER TABLE "Project" DROP COLUMN "category";
CREATE INDEX "Project_kind_idx" ON "Project"("kind");

-- New tables
CREATE TABLE "ProjectAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "key" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectAsset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectAsset_projectId_kind_idx" ON "ProjectAsset"("projectId", "kind");
ALTER TABLE "ProjectAsset" ADD CONSTRAINT "ProjectAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SparkAccount" (
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "frozen" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SparkAccount_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "SparkAccount" ADD CONSTRAINT "SparkAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SparkLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "type" "SparkType" NOT NULL,
    "refType" TEXT NOT NULL DEFAULT '',
    "refId" TEXT NOT NULL DEFAULT '',
    "memo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SparkLedger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SparkLedger_userId_createdAt_idx" ON "SparkLedger"("userId", "createdAt" DESC);
ALTER TABLE "SparkLedger" ADD CONSTRAINT "SparkLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reward" INTEGER NOT NULL,
    "quota" INTEGER NOT NULL,
    "claimedCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "frozenAmount" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'open',
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Task_status_deadline_idx" ON "Task"("status", "deadline");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_ownerId_createdAt_idx" ON "Task"("ownerId", "createdAt" DESC);
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TaskClaim" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'claimed',
    "feedback" TEXT NOT NULL DEFAULT '',
    "screenshotKey" TEXT,
    "reviewNote" TEXT NOT NULL DEFAULT '',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitBy" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "TaskClaim_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaskClaim_taskId_userId_key" ON "TaskClaim"("taskId", "userId");
CREATE INDEX "TaskClaim_userId_status_idx" ON "TaskClaim"("userId", "status");
CREATE INDEX "TaskClaim_taskId_status_idx" ON "TaskClaim"("taskId", "status");
ALTER TABLE "TaskClaim" ADD CONSTRAINT "TaskClaim_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskClaim" ADD CONSTRAINT "TaskClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TaskReport" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "resolverId" TEXT,
    "resolution" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "TaskReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaskReport_status_createdAt_idx" ON "TaskReport"("status", "createdAt");
ALTER TABLE "TaskReport" ADD CONSTRAINT "TaskReport_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "TaskClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskReport" ADD CONSTRAINT "TaskReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskReport" ADD CONSTRAINT "TaskReport_resolverId_fkey" FOREIGN KEY ("resolverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Comment_projectId_createdAt_idx" ON "Comment"("projectId", "createdAt" DESC);
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Bookmark" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("userId","projectId")
);
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectVote" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectVote_pkey" PRIMARY KEY ("userId","projectId")
);
ALTER TABLE "ProjectVote" ADD CONSTRAINT "ProjectVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectVote" ADD CONSTRAINT "ProjectVote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "refType" TEXT NOT NULL DEFAULT '',
    "refId" TEXT NOT NULL DEFAULT '',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
