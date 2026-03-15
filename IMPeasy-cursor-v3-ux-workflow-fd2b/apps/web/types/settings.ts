export type NumberingDocumentType =
  | 'customers'
  | 'quotes'
  | 'sales_orders'
  | 'manufacturing_orders'
  | 'purchase_orders'
  | 'shipments'
  | 'invoices'
  | 'lots';

export type CompanySetting = {
  id: number;
  companyName: string;
  legalName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  taxRate: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanySettingInput = {
  companyName?: string;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  taxRate?: number | null;
};

export type NumberingSetting = {
  id: number;
  documentType: NumberingDocumentType;
  prefix: string;
  separator: string;
  padding: number;
  createdAt: string;
  updatedAt: string;
};

export type NumberingSettingInput = {
  documentType: NumberingDocumentType;
  prefix: string;
  separator: string;
  padding: number;
};

export type SettingsListType =
  | 'payment_terms'
  | 'shipping_terms'
  | 'shipping_methods'
  | 'tax_rates';

export type SettingsListEntry = {
  id: number;
  listType: SettingsListType;
  code: string;
  label: string;
  numericValue: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SettingsListEntryInput = {
  code: string;
  label: string;
  numericValue?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type SettingsListEntryUpdateInput = {
  code?: string;
  label?: string;
  numericValue?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type DocumentTemplateType = 'quote' | 'sales_order' | 'shipment' | 'invoice';

export type DocumentTemplateSetting = {
  id: number;
  templateType: DocumentTemplateType;
  outputFormat: string;
  headerFieldsEnabled: boolean;
  footerNotesEnabled: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentTemplateSettingInput = {
  outputFormat?: string;
  headerFieldsEnabled?: boolean;
  footerNotesEnabled?: boolean;
  notes?: string | null;
};
