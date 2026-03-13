-- CreateTable
CREATE TABLE "work_orders" (
  "id" SERIAL NOT NULL,
  "salesOrderLineId" INTEGER NOT NULL,
  "routingId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_salesOrderLineId_key" ON "work_orders"("salesOrderLineId");

-- CreateIndex
CREATE INDEX "work_orders_routingId_idx" ON "work_orders"("routingId");

-- AddForeignKey
ALTER TABLE "work_orders"
  ADD CONSTRAINT "work_orders_salesOrderLineId_fkey"
  FOREIGN KEY ("salesOrderLineId") REFERENCES "sales_order_lines"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders"
  ADD CONSTRAINT "work_orders_routingId_fkey"
  FOREIGN KEY ("routingId") REFERENCES "routings"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
