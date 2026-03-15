-- CreateTable
CREATE TABLE "company_settings" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "taxNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numbering_settings" (
    "id" SERIAL NOT NULL,
    "documentType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "separator" TEXT NOT NULL DEFAULT '-',
    "padding" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "numbering_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_list_entries" (
    "id" SERIAL NOT NULL,
    "listType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "numericValue" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_list_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_template_settings" (
    "id" SERIAL NOT NULL,
    "templateType" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL DEFAULT 'pdf',
    "headerFieldsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "footerNotesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_template_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "numbering_settings_documentType_key" ON "numbering_settings"("documentType");

-- CreateIndex
CREATE INDEX "settings_list_entries_listType_sortOrder_id_idx" ON "settings_list_entries"("listType", "sortOrder", "id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_list_entries_listType_code_key" ON "settings_list_entries"("listType", "code");

-- CreateIndex
CREATE UNIQUE INDEX "document_template_settings_templateType_key" ON "document_template_settings"("templateType");
