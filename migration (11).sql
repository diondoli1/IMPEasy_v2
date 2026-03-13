-- CreateTable
CREATE TABLE "quote_lines" (
  "id" SERIAL NOT NULL,
  "quoteId" INTEGER NOT NULL,
  "itemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "lineTotal" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_lines_quoteId_idx" ON "quote_lines"("quoteId");

-- CreateIndex
CREATE INDEX "quote_lines_itemId_idx" ON "quote_lines"("itemId");

-- AddForeignKey
ALTER TABLE "quote_lines"
  ADD CONSTRAINT "quote_lines_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "quotes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines"
  ADD CONSTRAINT "quote_lines_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
