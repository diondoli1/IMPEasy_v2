-- Make salesOrderLineId optional for direct MO creation
ALTER TABLE "work_orders" ALTER COLUMN "salesOrderLineId" DROP NOT NULL;

-- Add itemId for direct MOs (when not linked to sales order line)
ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "itemId" INTEGER;

-- Add foreign key for itemId (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_itemId_fkey'
  ) THEN
    ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Create index for itemId
CREATE INDEX IF NOT EXISTS "work_orders_itemId_idx" ON "work_orders"("itemId");
