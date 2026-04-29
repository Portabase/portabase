ALTER TABLE "two_factor" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false;
UPDATE "two_factor" SET "verified" = true WHERE "verified" = false;
ALTER TABLE "two_factor" ALTER COLUMN "verified" SET NOT NULL;
ALTER TABLE "two_factor" ALTER COLUMN "verified" DROP DEFAULT;
