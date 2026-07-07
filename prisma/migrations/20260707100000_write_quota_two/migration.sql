-- 每日投信额度上调为 2：调整默认值并同步历史用户
ALTER TABLE "users" ALTER COLUMN "dailyWriteQuota" SET DEFAULT 2;
UPDATE "users" SET "dailyWriteQuota" = 2 WHERE "dailyWriteQuota" <> 2;
