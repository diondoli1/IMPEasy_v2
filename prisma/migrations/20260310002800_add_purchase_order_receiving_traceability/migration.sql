-- AlterTable
ALTER TABLE "inventory_transactions"
  ADD COLUMN "purchaseOrderLineId" INTEGER;

-- CreateIndex
CREATE INDEX "inventory_transactions_purchaseOrderLineId_idx"
  ON "inventory_transactions"("purchaseOrderLineId");

-- AddForeignKey
ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_purchaseOrderLineId_fkey"
  FOREIGN KEY ("purchaseOrderLineId") REFERENCES "purchase_order_lines"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
