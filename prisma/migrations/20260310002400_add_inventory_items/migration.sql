-- CreateTable
CREATE TABLE "inventory_items" (
  "id" SERIAL NOT NULL,
  "itemId" INTEGER NOT NULL,
  "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_itemId_key" ON "inventory_items"("itemId");

-- AddForeignKey
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
