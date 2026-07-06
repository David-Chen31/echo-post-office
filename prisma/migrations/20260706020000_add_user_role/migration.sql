-- 治理闭环 P1-1：为用户增加角色字段（user | moderator | admin）
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
