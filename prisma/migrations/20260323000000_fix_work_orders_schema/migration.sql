-- Fix work_orders, work_order_histories, work_order_operations, routing_operations for Manufacturing Orders

-- workstation_groups and workstations (required by routing_operations)
CREATE TABLE IF NOT EXISTS "workstation_groups" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "instanceCount" INTEGER NOT NULL DEFAULT 1,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workstation_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "workstation_groups_code_key" ON "workstation_groups"("code");

CREATE TABLE IF NOT EXISTS "workstations" (
    "id" SERIAL NOT NULL,
    "workstationGroupId" INTEGER NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workstations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "workstations_code_key" ON "workstations"("code");
CREATE INDEX IF NOT EXISTS "workstations_workstationGroupId_idx" ON "workstations"("workstationGroupId");

-- routing_operations: add workstationGroupId
ALTER TABLE "routing_operations" ADD COLUMN IF NOT EXISTS "workstationGroupId" INTEGER;
CREATE INDEX IF NOT EXISTS "routing_operations_workstationGroupId_idx" ON "routing_operations"("workstationGroupId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workstations_workstationGroupId_fkey') THEN
    ALTER TABLE "workstations" ADD CONSTRAINT "workstations_workstationGroupId_fkey"
      FOREIGN KEY ("workstationGroupId") REFERENCES "workstation_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'routing_operations_workstationGroupId_fkey') THEN
    ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_workstationGroupId_fkey"
      FOREIGN KEY ("workstationGroupId") REFERENCES "workstation_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- work_orders: add missing columns
ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "releasedAt" TIMESTAMP(3);
ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- work_order_history (renamed to work_order_histories in later migration): add eventType and message if missing (Prisma expects these)
ALTER TABLE "work_order_history" ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE "work_order_history" ADD COLUMN IF NOT EXISTS "message" TEXT;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_order_history' AND column_name='action') THEN
    UPDATE "work_order_history" SET "eventType" = COALESCE("action", 'status_change') WHERE "eventType" IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_order_history' AND column_name='notes') THEN
    UPDATE "work_order_history" SET "message" = COALESCE("notes", '') WHERE "message" IS NULL;
  END IF;
END $$;
ALTER TABLE "work_order_history" ALTER COLUMN "eventType" SET DEFAULT 'status_change';
ALTER TABLE "work_order_history" ALTER COLUMN "message" SET DEFAULT '';
ALTER TABLE "work_order_history" ALTER COLUMN "eventType" SET NOT NULL;
ALTER TABLE "work_order_history" ALTER COLUMN "message" SET NOT NULL;

-- work_order_operations: add missing columns for Prisma
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "reworkSourceOperationId" INTEGER;
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "workstation" TEXT;
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "assignedOperatorId" INTEGER;
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3);
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "goodQuantity" INTEGER;
ALTER TABLE "work_order_operations" ADD COLUMN IF NOT EXISTS "scrapQuantity" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "work_order_operations_reworkSourceOperationId_key"
  ON "work_order_operations"("reworkSourceOperationId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_order_operations_reworkSourceOperationId_fkey') THEN
    ALTER TABLE "work_order_operations"
      ADD CONSTRAINT "work_order_operations_reworkSourceOperationId_fkey"
      FOREIGN KEY ("reworkSourceOperationId") REFERENCES "work_order_operations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "work_order_operations_assignedOperatorId_idx"
  ON "work_order_operations"("assignedOperatorId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_order_operations_assignedOperatorId_fkey') THEN
    ALTER TABLE "work_order_operations"
      ADD CONSTRAINT "work_order_operations_assignedOperatorId_fkey"
      FOREIGN KEY ("assignedOperatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- material_bookings: add bomItemId, consumedAt, updatedAt if missing (Prisma expects these)
ALTER TABLE "material_bookings" ADD COLUMN IF NOT EXISTS "bomItemId" INTEGER;
ALTER TABLE "material_bookings" ADD COLUMN IF NOT EXISTS "consumedAt" TIMESTAMP(3);
ALTER TABLE "material_bookings" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "material_bookings" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "material_bookings" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "material_bookings" ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "material_bookings_bomItemId_idx" ON "material_bookings"("bomItemId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_bookings_bomItemId_fkey') THEN
    ALTER TABLE "material_bookings"
      ADD CONSTRAINT "material_bookings_bomItemId_fkey"
      FOREIGN KEY ("bomItemId") REFERENCES "bom_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- stock_lots: add sourceType, sourceReference, receivedAt, status (Prisma expects these)
ALTER TABLE "stock_lots" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "stock_lots" ADD COLUMN IF NOT EXISTS "sourceReference" TEXT;
ALTER TABLE "stock_lots" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3);
ALTER TABLE "stock_lots" ADD COLUMN IF NOT EXISTS "status" TEXT;
UPDATE "stock_lots" SET "status" = 'available' WHERE "status" IS NULL;
ALTER TABLE "stock_lots" ALTER COLUMN "status" SET DEFAULT 'available';
ALTER TABLE "stock_lots" ALTER COLUMN "status" SET NOT NULL;

-- items: fix null defaultPrice (Prisma expects non-null Float)
UPDATE "items" SET "defaultPrice" = 0 WHERE "defaultPrice" IS NULL;
