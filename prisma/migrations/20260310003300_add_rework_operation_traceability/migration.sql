ALTER TABLE "work_order_operations"
ADD COLUMN "reworkSourceOperationId" INTEGER;

CREATE UNIQUE INDEX "work_order_operations_reworkSourceOperationId_key"
ON "work_order_operations"("reworkSourceOperationId");

ALTER TABLE "work_order_operations"
ADD CONSTRAINT "work_order_operations_reworkSourceOperationId_fkey"
FOREIGN KEY ("reworkSourceOperationId") REFERENCES "work_order_operations"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
