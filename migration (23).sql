-- CreateTable
CREATE TABLE "routing_operations" (
  "id" SERIAL NOT NULL,
  "routingId" INTEGER NOT NULL,
  "sequence" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "routing_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routing_operations_routingId_idx" ON "routing_operations"("routingId");

-- AddForeignKey
ALTER TABLE "routing_operations"
  ADD CONSTRAINT "routing_operations_routingId_fkey"
  FOREIGN KEY ("routingId") REFERENCES "routings"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
