-- CreateTable
CREATE TABLE "sales_order_audits" (
  "id" SERIAL NOT NULL,
  "salesOrderId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sales_order_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_order_audits_salesOrderId_idx" ON "sales_order_audits"("salesOrderId");

-- AddForeignKey
ALTER TABLE "sales_order_audits"
  ADD CONSTRAINT "sales_order_audits_salesOrderId_fkey"
  FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
