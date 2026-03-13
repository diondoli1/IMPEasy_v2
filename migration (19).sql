-- CreateTable
CREATE TABLE "bom_items" (
  "id" SERIAL NOT NULL,
  "bomId" INTEGER NOT NULL,
  "itemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bom_items_bomId_idx" ON "bom_items"("bomId");

-- CreateIndex
CREATE INDEX "bom_items_itemId_idx" ON "bom_items"("itemId");

-- AddForeignKey
ALTER TABLE "bom_items"
  ADD CONSTRAINT "bom_items_bomId_fkey"
  FOREIGN KEY ("bomId") REFERENCES "boms"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items"
  ADD CONSTRAINT "bom_items_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
