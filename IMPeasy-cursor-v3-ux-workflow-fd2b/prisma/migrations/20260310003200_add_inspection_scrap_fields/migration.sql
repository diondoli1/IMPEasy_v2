ALTER TABLE "inspections"
ADD COLUMN "scrappedQuantity" INTEGER,
ADD COLUMN "scrapNotes" TEXT,
ADD COLUMN "scrappedAt" TIMESTAMP(3);
