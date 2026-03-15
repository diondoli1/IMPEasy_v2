-- CreateTable
CREATE TABLE "inspections" (
  "id" SERIAL NOT NULL,
  "operationId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspections_operationId_key" ON "inspections"("operationId");

-- AddForeignKey
ALTER TABLE "inspections"
  ADD CONSTRAINT "inspections_operationId_fkey"
  FOREIGN KEY ("operationId") REFERENCES "work_order_operations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
