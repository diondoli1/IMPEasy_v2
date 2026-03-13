-- CreateTable
CREATE TABLE "boms" (
  "id" SERIAL NOT NULL,
  "itemId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boms_itemId_idx" ON "boms"("itemId");

-- AddForeignKey
ALTER TABLE "boms"
  ADD CONSTRAINT "boms_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
