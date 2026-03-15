-- Fix invoices table to match Prisma schema for CRM Invoices tab

-- Add customerId (required by Prisma)
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "customerId" INTEGER;

DO $$
DECLARE
  first_cust_id INT;
BEGIN
  SELECT id INTO first_cust_id FROM customers ORDER BY id LIMIT 1;
  IF first_cust_id IS NOT NULL THEN
    UPDATE invoices SET "customerId" = first_cust_id WHERE "customerId" IS NULL;
  END IF;
END $$;

ALTER TABLE "invoices" ALTER COLUMN "customerId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_customerId_fkey') THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "invoices_customerId_idx" ON "invoices"("customerId");

-- Add issueDate (Prisma uses issueDate)
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3);
UPDATE "invoices" SET "issueDate" = "createdAt" WHERE "issueDate" IS NULL;
ALTER TABLE "invoices" ALTER COLUMN "issueDate" SET DEFAULT CURRENT_TIMESTAMP;

-- Add paidAt
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

-- Add invoiceType
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoiceType" TEXT;
UPDATE "invoices" SET "invoiceType" = 'invoice' WHERE "invoiceType" IS NULL;
ALTER TABLE "invoices" ALTER COLUMN "invoiceType" SET DEFAULT 'invoice';

-- Add billing columns
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "billingStreet" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "billingCity" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "billingPostcode" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "billingStateRegion" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "billingCountry" TEXT;

-- Create invoice_lines table if not exists
CREATE TABLE IF NOT EXISTS "invoice_lines" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "shipmentLineId" INTEGER,
    "salesOrderLineId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");
CREATE INDEX IF NOT EXISTS "invoice_lines_shipmentLineId_idx" ON "invoice_lines"("shipmentLineId");
CREATE INDEX IF NOT EXISTS "invoice_lines_salesOrderLineId_idx" ON "invoice_lines"("salesOrderLineId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_lines_invoiceId_fkey') THEN
    ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_lines_shipmentLineId_fkey') THEN
    ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_shipmentLineId_fkey"
      FOREIGN KEY ("shipmentLineId") REFERENCES "shipment_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_lines_salesOrderLineId_fkey') THEN
    ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_salesOrderLineId_fkey"
      FOREIGN KEY ("salesOrderLineId") REFERENCES "sales_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
