-- AlterTable
ALTER TABLE "bom_items" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rowOrder" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "boms" ADD COLUMN     "code" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "code" TEXT,
ADD COLUMN     "defaultBomId" INTEGER,
ADD COLUMN     "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "itemGroup" TEXT,
ADD COLUMN     "itemType" TEXT NOT NULL DEFAULT 'produced',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preferredVendorId" INTEGER,
ADD COLUMN     "reorderPoint" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "safetyStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitOfMeasure" TEXT NOT NULL DEFAULT 'pcs';

-- AlterTable
ALTER TABLE "routing_operations" ADD COLUMN     "moveNotes" TEXT,
ADD COLUMN     "queueNotes" TEXT,
ADD COLUMN     "runTimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "setupTimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workstation" TEXT;

-- AlterTable
ALTER TABLE "routings" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "work_order_operations" ADD COLUMN     "assignedOperatorId" INTEGER,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "goodQuantity" INTEGER,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "scrapQuantity" INTEGER,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "workstation" TEXT;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "assignedOperatorId" INTEGER,
ADD COLUMN     "assignedWorkstation" TEXT,
ADD COLUMN     "bomId" INTEGER,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "finishedGoodsLotId" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "releasedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "stock_lots" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL,
    "notes" TEXT,
    "sourceWorkOrderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_bookings" (
    "id" SERIAL NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "bomItemId" INTEGER NOT NULL,
    "stockLotId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_history" (
    "id" SERIAL NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_lots_lotNumber_key" ON "stock_lots"("lotNumber");

-- CreateIndex
CREATE INDEX "stock_lots_itemId_idx" ON "stock_lots"("itemId");

-- CreateIndex
CREATE INDEX "stock_lots_sourceWorkOrderId_idx" ON "stock_lots"("sourceWorkOrderId");

-- CreateIndex
CREATE INDEX "material_bookings_workOrderId_idx" ON "material_bookings"("workOrderId");

-- CreateIndex
CREATE INDEX "material_bookings_bomItemId_idx" ON "material_bookings"("bomItemId");

-- CreateIndex
CREATE INDEX "material_bookings_stockLotId_idx" ON "material_bookings"("stockLotId");

-- CreateIndex
CREATE UNIQUE INDEX "material_bookings_workOrderId_bomItemId_stockLotId_key" ON "material_bookings"("workOrderId", "bomItemId", "stockLotId");

-- CreateIndex
CREATE INDEX "work_order_history_workOrderId_idx" ON "work_order_history"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");

-- CreateIndex
CREATE INDEX "items_defaultBomId_idx" ON "items"("defaultBomId");

-- CreateIndex
CREATE INDEX "items_preferredVendorId_idx" ON "items"("preferredVendorId");

-- CreateIndex
CREATE INDEX "work_order_operations_assignedOperatorId_idx" ON "work_order_operations"("assignedOperatorId");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_finishedGoodsLotId_key" ON "work_orders"("finishedGoodsLotId");

-- CreateIndex
CREATE INDEX "work_orders_bomId_idx" ON "work_orders"("bomId");

-- CreateIndex
CREATE INDEX "work_orders_assignedOperatorId_idx" ON "work_orders"("assignedOperatorId");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_defaultBomId_fkey" FOREIGN KEY ("defaultBomId") REFERENCES "boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_preferredVendorId_fkey" FOREIGN KEY ("preferredVendorId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_finishedGoodsLotId_fkey" FOREIGN KEY ("finishedGoodsLotId") REFERENCES "stock_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_operations" ADD CONSTRAINT "work_order_operations_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_sourceWorkOrderId_fkey" FOREIGN KEY ("sourceWorkOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_bookings" ADD CONSTRAINT "material_bookings_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_bookings" ADD CONSTRAINT "material_bookings_bomItemId_fkey" FOREIGN KEY ("bomItemId") REFERENCES "bom_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_bookings" ADD CONSTRAINT "material_bookings_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "stock_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_history" ADD CONSTRAINT "work_order_history_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

