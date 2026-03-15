export const NUMBERING_DOCUMENT_TYPES = [
  'customers',
  'quotes',
  'sales_orders',
  'manufacturing_orders',
  'purchase_orders',
  'shipments',
  'invoices',
  'lots',
] as const;

export type NumberingDocumentType = (typeof NUMBERING_DOCUMENT_TYPES)[number];

export const DEFAULT_NUMBERING_SETTINGS: Record<
  NumberingDocumentType,
  {
    prefix: string;
    separator: string;
    padding: number;
  }
> = {
  customers: { prefix: 'CU', separator: '', padding: 5 },
  quotes: { prefix: 'Q', separator: '', padding: 5 },
  sales_orders: { prefix: 'CO', separator: '', padding: 5 },
  manufacturing_orders: { prefix: 'MO', separator: '', padding: 5 },
  purchase_orders: { prefix: 'PO', separator: '', padding: 5 },
  shipments: { prefix: 'S', separator: '', padding: 5 },
  invoices: { prefix: 'I', separator: '', padding: 5 },
  lots: { prefix: 'FG', separator: '', padding: 4 },
};

export const SETTINGS_LIST_TYPES = [
  'payment_terms',
  'shipping_terms',
  'shipping_methods',
  'tax_rates',
] as const;

export type SettingsListType = (typeof SETTINGS_LIST_TYPES)[number];

export const DEFAULT_SETTINGS_LIST_ENTRIES: Record<
  SettingsListType,
  Array<{
    code: string;
    label: string;
    numericValue: number | null;
    sortOrder: number;
  }>
> = {
  payment_terms: [
    { code: 'NET14', label: 'Net 14 days', numericValue: null, sortOrder: 10 },
    { code: 'NET30', label: 'Net 30 days', numericValue: null, sortOrder: 20 },
    { code: 'PREPAY', label: 'Prepayment required', numericValue: null, sortOrder: 30 },
  ],
  shipping_terms: [
    { code: 'DAP', label: 'Delivered at place', numericValue: null, sortOrder: 10 },
    { code: 'EXW', label: 'Ex works', numericValue: null, sortOrder: 20 },
    { code: 'FCA', label: 'Free carrier', numericValue: null, sortOrder: 30 },
  ],
  shipping_methods: [
    { code: 'DHL-STD', label: 'DHL Standard', numericValue: null, sortOrder: 10 },
    { code: 'PICKUP', label: 'Customer pickup', numericValue: null, sortOrder: 20 },
    { code: 'EXPRESS', label: 'Express courier', numericValue: null, sortOrder: 30 },
  ],
  tax_rates: [
    { code: 'DE-19', label: 'Germany standard', numericValue: 19, sortOrder: 10 },
    { code: 'DE-07', label: 'Germany reduced', numericValue: 7, sortOrder: 20 },
    { code: 'ZERO', label: 'Zero rated', numericValue: 0, sortOrder: 30 },
  ],
};

export const DOCUMENT_TEMPLATE_TYPES = [
  'quote',
  'sales_order',
  'shipment',
  'invoice',
] as const;

export type DocumentTemplateType = (typeof DOCUMENT_TEMPLATE_TYPES)[number];

export const DEFAULT_DOCUMENT_TEMPLATES: Record<
  DocumentTemplateType,
  {
    outputFormat: string;
    headerFieldsEnabled: boolean;
    footerNotesEnabled: boolean;
    notes: string | null;
  }
> = {
  quote: {
    outputFormat: 'pdf',
    headerFieldsEnabled: true,
    footerNotesEnabled: true,
    notes: 'Compact commercial header, totals block, and customer summary.',
  },
  sales_order: {
    outputFormat: 'pdf',
    headerFieldsEnabled: true,
    footerNotesEnabled: true,
    notes: 'Dense line layout aligned to order-board handoff.',
  },
  shipment: {
    outputFormat: 'pdf',
    headerFieldsEnabled: true,
    footerNotesEnabled: true,
    notes: 'Simple dispatch slip with lot references kept visible.',
  },
  invoice: {
    outputFormat: 'pdf',
    headerFieldsEnabled: true,
    footerNotesEnabled: true,
    notes: 'Operational invoice output without accounting extras.',
  },
};

export const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'IMPeasy Manufacturing',
  legalName: 'IMPeasy Manufacturing GmbH',
  address: 'Landsberger Allee 14, 10249 Berlin',
  phone: '+49 30 5555 2800',
  email: 'operations@impeasy.local',
  website: 'www.impeasy.local',
  taxNumber: 'DE342198445',
} as const;
