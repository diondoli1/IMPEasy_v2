-- AlterTable
ALTER TABLE "items"
  ADD COLUMN "defaultRoutingId" INTEGER;

-- CreateIndex
CREATE INDEX "items_defaultRoutingId_idx" ON "items"("defaultRoutingId");

-- AddForeignKey
ALTER TABLE "items"
  ADD CONSTRAINT "items_defaultRoutingId_fkey"
  FOREIGN KEY ("defaultRoutingId") REFERENCES "routings"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
