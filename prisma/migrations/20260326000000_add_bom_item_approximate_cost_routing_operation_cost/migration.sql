-- AlterTable
ALTER TABLE "bom_items" ADD COLUMN IF NOT EXISTS "approximateCost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "routing_operations" ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION;
