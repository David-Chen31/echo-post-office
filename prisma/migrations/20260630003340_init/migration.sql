-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'WRITE_LIMITED', 'REPLY_LIMITED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('NEWCOMER', 'READER', 'REPLIER', 'KEEPER');

-- CreateEnum
CREATE TYPE "LetterCategory" AS ENUM ('STUDY', 'WORK', 'LOVE', 'FAMILY', 'FRIENDSHIP', 'GROWTH', 'LONELINESS', 'CONFUSION', 'REGRET', 'LIFE_STORY', 'JUST_TALK', 'OTHER');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('CALM', 'SAD', 'ANXIOUS', 'TIRED', 'HOPEFUL', 'GRATEFUL', 'CONFUSED', 'OTHER');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_MODERATION', 'WAITING_CLAIM', 'CLAIMED', 'REPLIED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('CLAIMED', 'REPLIED', 'EXPIRED', 'RELEASED');

-- CreateEnum
CREATE TYPE "ReplyStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_MODERATION', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NONE', 'LOW', 'HIGH');

-- CreateEnum
CREATE TYPE "ReplyFeedbackType" AS ENUM ('UNDERSTOOD', 'SERIOUS', 'HELPFUL', 'AVERAGE', 'UNCOMFORTABLE');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('LETTER', 'REPLY', 'USER');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('HARASSMENT', 'ATTACK', 'PORN', 'AD_FRAUD', 'ASK_CONTACT', 'DANGEROUS_ADVICE', 'PRIVACY_LEAK', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('PASS', 'MASK_PASS', 'RETURN', 'REJECT', 'LIMIT', 'BAN', 'ESCALATE');

-- CreateEnum
CREATE TYPE "SensitiveType" AS ENUM ('PHONE', 'WECHAT', 'EMAIL', 'ADDRESS', 'ID_CARD', 'BANK', 'SCHOOL_CLASS', 'COMPANY', 'ABUSE', 'HATE', 'AD', 'FRAUD', 'SELF_HARM', 'VIOLENCE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REPLY_RECEIVED', 'MODERATION_RESULT', 'CLAIM_EXPIRING', 'CONVERSATION_REQUEST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "ModTargetType" AS ENUM ('LETTER', 'REPLY');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "nickname" VARCHAR(32) NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(32),
    "passwordHash" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "level" "UserLevel" NOT NULL DEFAULT 'NEWCOMER',
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "interestedTopics" JSONB NOT NULL DEFAULT '[]',
    "blockedTopics" JSONB NOT NULL DEFAULT '[]',
    "dailyWriteQuota" INTEGER NOT NULL DEFAULT 1,
    "dailyClaimQuota" INTEGER NOT NULL DEFAULT 2,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" BIGSERIAL NOT NULL,
    "blockerId" BIGINT NOT NULL,
    "blockedId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters" (
    "id" BIGSERIAL NOT NULL,
    "authorId" BIGINT NOT NULL,
    "title" VARCHAR(60),
    "content" TEXT NOT NULL,
    "category" "LetterCategory" NOT NULL,
    "mood" "Mood",
    "replyPreference" JSONB NOT NULL DEFAULT '{}',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "maxReplies" INTEGER NOT NULL DEFAULT 1,
    "status" "LetterStatus" NOT NULL DEFAULT 'SUBMITTED',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_drafts" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "title" VARCHAR(60),
    "content" TEXT NOT NULL,
    "category" "LetterCategory",
    "mood" "Mood",
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_claims" (
    "id" BIGSERIAL NOT NULL,
    "letterId" BIGINT NOT NULL,
    "readerId" BIGINT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'CLAIMED',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" BIGSERIAL NOT NULL,
    "letterId" BIGINT NOT NULL,
    "claimId" BIGINT NOT NULL,
    "writerId" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReplyStatus" NOT NULL DEFAULT 'SUBMITTED',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NONE',
    "isFavorited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reply_feedbacks" (
    "id" BIGSERIAL NOT NULL,
    "replyId" BIGINT NOT NULL,
    "raterId" BIGINT NOT NULL,
    "type" "ReplyFeedbackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" BIGSERIAL NOT NULL,
    "userAId" BIGINT NOT NULL,
    "userBId" BIGINT NOT NULL,
    "sourceLetterId" BIGINT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" BIGSERIAL NOT NULL,
    "reporterId" BIGINT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" BIGINT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "priority" "ReportPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "handledById" BIGINT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_records" (
    "id" BIGSERIAL NOT NULL,
    "targetType" "ModTargetType" NOT NULL,
    "targetId" BIGINT NOT NULL,
    "autoResult" JSONB NOT NULL DEFAULT '{}',
    "action" "ModerationAction" NOT NULL,
    "operatorId" BIGINT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitive_hits" (
    "id" BIGSERIAL NOT NULL,
    "targetType" "ModTargetType" NOT NULL,
    "targetId" BIGINT NOT NULL,
    "type" "SensitiveType" NOT NULL,
    "matched" VARCHAR(255) NOT NULL,
    "startPos" INTEGER,
    "endPos" INTEGER,
    "masked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensitive_hits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "operatorId" BIGINT NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "targetType" VARCHAR(32) NOT NULL,
    "targetId" BIGINT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" BIGSERIAL NOT NULL,
    "statDate" DATE NOT NULL,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "newLetters" INTEGER NOT NULL DEFAULT 0,
    "repliedLetters" INTEGER NOT NULL DEFAULT 0,
    "pendingLetters" INTEGER NOT NULL DEFAULT 0,
    "avgWaitMinutes" INTEGER NOT NULL DEFAULT 0,
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "highRiskCount" INTEGER NOT NULL DEFAULT 0,
    "replyCompletion" INTEGER NOT NULL DEFAULT 0,
    "weeklyExchanges" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_configs" (
    "key" VARCHAR(64) NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_configs_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blockerId_blockedId_key" ON "user_blocks"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "letters_status_category_idx" ON "letters"("status", "category");

-- CreateIndex
CREATE INDEX "letters_authorId_idx" ON "letters"("authorId");

-- CreateIndex
CREATE INDEX "letters_riskLevel_idx" ON "letters"("riskLevel");

-- CreateIndex
CREATE INDEX "letter_drafts_userId_idx" ON "letter_drafts"("userId");

-- CreateIndex
CREATE INDEX "letter_claims_status_expiresAt_idx" ON "letter_claims"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "letter_claims_letterId_readerId_key" ON "letter_claims"("letterId", "readerId");

-- CreateIndex
CREATE UNIQUE INDEX "replies_claimId_key" ON "replies"("claimId");

-- CreateIndex
CREATE INDEX "replies_letterId_idx" ON "replies"("letterId");

-- CreateIndex
CREATE INDEX "replies_writerId_idx" ON "replies"("writerId");

-- CreateIndex
CREATE UNIQUE INDEX "reply_feedbacks_replyId_raterId_key" ON "reply_feedbacks"("replyId", "raterId");

-- CreateIndex
CREATE INDEX "conversations_userAId_idx" ON "conversations"("userAId");

-- CreateIndex
CREATE INDEX "conversations_userBId_idx" ON "conversations"("userBId");

-- CreateIndex
CREATE INDEX "reports_status_priority_idx" ON "reports"("status", "priority");

-- CreateIndex
CREATE INDEX "reports_targetType_targetId_idx" ON "reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_records_targetType_targetId_idx" ON "moderation_records"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "sensitive_hits_targetType_targetId_idx" ON "sensitive_hits"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "audit_logs_operatorId_idx" ON "audit_logs"("operatorId");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_statDate_key" ON "daily_stats"("statDate");

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_claims" ADD CONSTRAINT "letter_claims_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_claims" ADD CONSTRAINT "letter_claims_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "letter_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply_feedbacks" ADD CONSTRAINT "reply_feedbacks_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "replies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply_feedbacks" ADD CONSTRAINT "reply_feedbacks_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
