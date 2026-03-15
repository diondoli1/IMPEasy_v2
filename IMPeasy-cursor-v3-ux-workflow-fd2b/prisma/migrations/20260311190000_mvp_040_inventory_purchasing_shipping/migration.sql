-- AlterTable
ALTER TABLE "inventory_transactions"
ADD COLUMN     "referenceId" INTEGER,
ADD COLUMN     "referenceNumber" TEXT,
ADD COLUMN     "referenceType" TEXT,
ADD COLUMN     "stockLotId" INTEGER,
ADD COLUMN     "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "invoices"
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "number" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders"
ADD COLUMN     "buyer" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "expectedDate" TIMESTAMP(3),
ADD COLUMN     "number" TEXT,
ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentTerm" TEXT,
ADD COLUMN     "supplierReference" TEXT;

-- AlterTable
ALTER TABLE "shipments"
ADD COLUMN     "carrierMethod" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "number" TEXT,
ADD COLUMN     "shipDate" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "stock_lots"
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "sourceReference" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'available';

-- AlterTable
ALTER TABLE "suppliers"
ADD COLUMN     "code" TEXT;

-- CreateTable
CREATE TABLE "item_vendor_terms" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "vendorItemCode" TEXT,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_vendor_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_picks" (
    "id" SERIAL NOT NULL,
    "shipmentLineId" INTEGER NOT NULL,
    "stockLotId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pickedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_picks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_transactions_stockLotId_idx" ON "inventory_transactions"("stockLotId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "item_vendor_terms_itemId_idx" ON "item_vendor_terms"("itemId");

-- CreateIndex
CREATE INDEX "item_vendor_terms_supplierId_idx" ON "item_vendor_terms"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "item_vendor_terms_itemId_supplierId_key" ON "item_vendor_terms"("itemId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_number_key" ON "purchase_orders"("number");

-- CreateIndex
CREATE INDEX "shipment_picks_shipmentLineId_idx" ON "shipment_picks"("shipmentLineId");

-- CreateIndex
CREATE INDEX "shipment_picks_stockLotId_idx" ON "shipment_picks"("stockLotId");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_picks_shipmentLineId_stockLotId_key" ON "shipment_picks"("shipmentLineId", "stockLotId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_number_key" ON "shipments"("number");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "stock_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_vendor_terms" ADD CONSTRAINT "item_vendor_terms_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_vendor_terms" ADD CONSTRAINT "item_vendor_terms_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_picks" ADD CONSTRAINT "shipment_picks_shipmentLineId_fkey" FOREIGN KEY ("shipmentLineId") REFERENCES "shipment_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_picks" ADD CONSTRAINT "shipment_picks_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "stock_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
