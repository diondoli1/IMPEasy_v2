-- CreateTable
CREATE TABLE "routings" (
  "id" SERIAL NOT NULL,
  "itemId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "routings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routings_itemId_idx" ON "routings"("itemId");

-- AddForeignKey
ALTER TABLE "routings"
  ADD CONSTRAINT "routings_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
