-- CreateTable
CREATE TABLE "production_logs" (
  "id" SERIAL NOT NULL,
  "operationId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_logs_operationId_idx" ON "production_logs"("operationId");

-- AddForeignKey
ALTER TABLE "production_logs"
  ADD CONSTRAINT "production_logs_operationId_fkey"
  FOREIGN KEY ("operationId") REFERENCES "work_order_operations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
