-- Add customer status and CRM fields per UX spec (TICKET-B7)
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "regNo" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "contactStarted" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "nextContact" TIMESTAMP(3);

-- Backfill status from isActive for existing records
UPDATE "customers" SET "status" = 'interested' WHERE "status" IS NULL AND "isActive" = true;
UPDATE "customers" SET "status" = 'no_contact' WHERE "status" IS NULL AND "isActive" = false;
