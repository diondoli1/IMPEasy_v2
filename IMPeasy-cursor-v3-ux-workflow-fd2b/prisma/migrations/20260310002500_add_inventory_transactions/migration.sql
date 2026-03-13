-- CreateTable
CREATE TABLE "inventory_transactions" (
  "id" SERIAL NOT NULL,
  "inventoryItemId" INTEGER NOT NULL,
  "itemId" INTEGER NOT NULL,
  "transactionType" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_transactions_inventoryItemId_idx" ON "inventory_transactions"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_transactions_itemId_idx" ON "inventory_transactions"("itemId");

-- AddForeignKey
ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
