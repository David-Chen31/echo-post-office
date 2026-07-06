-- 写信页可编辑 称谓 / 署名 / 日期：为信件增加三列（均可空，向后兼容旧数据）
ALTER TABLE "letters" ADD COLUMN "salutation" VARCHAR(40);
ALTER TABLE "letters" ADD COLUMN "signature" VARCHAR(40);
ALTER TABLE "letters" ADD COLUMN "signedDate" VARCHAR(40);
