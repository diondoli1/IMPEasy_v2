-- CreateTable
CREATE TABLE "workstation_groups" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "instanceCount" INTEGER NOT NULL DEFAULT 1,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workstation_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workstation_groups_code_key" ON "workstation_groups"("code");

-- CreateTable
CREATE TABLE "workstations" (
    "id" SERIAL NOT NULL,
    "workstationGroupId" INTEGER NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workstations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workstations_code_key" ON "workstations"("code");
CREATE INDEX "workstations_workstationGroupId_idx" ON "workstations"("workstationGroupId");

-- AlterTable
ALTER TABLE "routing_operations" ADD COLUMN "workstationGroupId" INTEGER;

CREATE INDEX "routing_operations_workstationGroupId_idx" ON "routing_operations"("workstationGroupId");

-- AddForeignKey
ALTER TABLE "workstations" ADD CONSTRAINT "workstations_workstationGroupId_fkey" FOREIGN KEY ("workstationGroupId") REFERENCES "workstation_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_workstationGroupId_fkey" FOREIGN KEY ("workstationGroupId") REFERENCES "workstation_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
