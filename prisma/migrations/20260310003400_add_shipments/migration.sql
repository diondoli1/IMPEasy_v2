CREATE TABLE "shipments" (
    "id" SERIAL NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipment_lines" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "salesOrderLineId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipments_salesOrderId_idx" ON "shipments"("salesOrderId");
CREATE INDEX "shipment_lines_shipmentId_idx" ON "shipment_lines"("shipmentId");
CREATE INDEX "shipment_lines_salesOrderLineId_idx" ON "shipment_lines"("salesOrderLineId");

ALTER TABLE "shipments"
ADD CONSTRAINT "shipments_salesOrderId_fkey"
FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipment_lines"
ADD CONSTRAINT "shipment_lines_shipmentId_fkey"
FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipment_lines"
ADD CONSTRAINT "shipment_lines_salesOrderLineId_fkey"
FOREIGN KEY ("salesOrderLineId") REFERENCES "sales_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
