-- AlterTable: Make Invoice.shipmentId optional, add standalone invoice support
ALTER TABLE "invoices" ALTER COLUMN "shipmentId" DROP NOT NULL;

ALTER TABLE "invoices" ADD COLUMN "salesOrderId" INTEGER;
ALTER TABLE "invoices" ADD COLUMN "invoiceType" TEXT NOT NULL DEFAULT 'invoice';
ALTER TABLE "invoices" ADD COLUMN "billingStreet" TEXT;
ALTER TABLE "invoices" ADD COLUMN "billingCity" TEXT;
ALTER TABLE "invoices" ADD COLUMN "billingPostcode" TEXT;
ALTER TABLE "invoices" ADD COLUMN "billingStateRegion" TEXT;
ALTER TABLE "invoices" ADD COLUMN "billingCountry" TEXT;
ALTER TABLE "invoices" ADD COLUMN "notes" TEXT;

CREATE INDEX "invoices_salesOrderId_idx" ON "invoices"("salesOrderId");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salesOrderId_fkey"
  FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Make InvoiceLine.shipmentLineId optional, add salesOrderLineId
ALTER TABLE "invoice_lines" ALTER COLUMN "shipmentLineId" DROP NOT NULL;

ALTER TABLE "invoice_lines" ADD COLUMN "salesOrderLineId" INTEGER;
CREATE INDEX "invoice_lines_salesOrderLineId_idx" ON "invoice_lines"("salesOrderLineId");
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_salesOrderLineId_fkey"
  FOREIGN KEY ("salesOrderLineId") REFERENCES "sales_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
