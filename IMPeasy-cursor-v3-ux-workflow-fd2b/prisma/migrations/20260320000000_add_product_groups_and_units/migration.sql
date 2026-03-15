-- TICKET-B9: Product groups and units of measurement for Stock Settings
CREATE TABLE IF NOT EXISTS "product_groups" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_groups_code_key" ON "product_groups"("code");

CREATE TABLE IF NOT EXISTS "unit_of_measures" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseUnit" TEXT,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_of_measures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "unit_of_measures_name_key" ON "unit_of_measures"("name");
