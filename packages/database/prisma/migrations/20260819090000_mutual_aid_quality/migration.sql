-- CreateEnum
CREATE TYPE "ReportKind" AS ENUM ('report', 'spot_check');
CREATE TYPE "FeedbackType" AS ENUM ('first_run', 'bug_hunt', 'onboarding', 'copy_review', 'invite_user');

-- AlterTable Task
ALTER TABLE "Task" ADD COLUMN "feedbackType" "FeedbackType" NOT NULL DEFAULT 'first_run';
ALTER TABLE "Task" ADD COLUMN "checklist" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Task" ADD COLUMN "allowPublicSnippet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable TaskClaim
ALTER TABLE "TaskClaim" ADD COLUMN "answers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "TaskClaim" ADD COLUMN "autoAccepted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable TaskReport
ALTER TABLE "TaskReport" ADD COLUMN "kind" "ReportKind" NOT NULL DEFAULT 'report';
