-- CreateTable
CREATE TABLE "work_order_operations" (
  "id" SERIAL NOT NULL,
  "workOrderId" INTEGER NOT NULL,
  "routingOperationId" INTEGER NOT NULL,
  "sequence" INTEGER NOT NULL,
  "plannedQuantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "work_order_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_operations_workOrderId_idx" ON "work_order_operations"("workOrderId");

-- CreateIndex
CREATE INDEX "work_order_operations_routingOperationId_idx" ON "work_order_operations"("routingOperationId");

-- AddForeignKey
ALTER TABLE "work_order_operations"
  ADD CONSTRAINT "work_order_operations_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_operations"
  ADD CONSTRAINT "work_order_operations_routingOperationId_fkey"
  FOREIGN KEY ("routingOperationId") REFERENCES "routing_operations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
