import type { ContactInput } from './contact';

export type CustomerAddress = {
  street?: string | null;
  city?: string | null;
  postcode?: string | null;
  stateRegion?: string | null;
  country?: string | null;
};

export type CustomerDocumentSummary = {
  kind: 'quote' | 'sales_order';
  id: number;
  documentNumber: string;
  status: string;
  promisedDate: string | null;
  totalAmount: number;
  updatedAt: string;
};

export type Customer = {
  id: number;
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  website: string | null;
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  defaultPaymentTerm: string | null;
  defaultShippingTerm: string | null;
  defaultShippingMethod: string | null;
  defaultDocumentDiscountPercent: number;
  defaultTaxRate: number;
  internalNotes: string | null;
  isActive: boolean;
  contacts: Array<{
    id: number;
    customerId: number;
    name: string;
    jobTitle: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  documents: CustomerDocumentSummary[];
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  website?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
  defaultPaymentTerm?: string;
  defaultShippingTerm?: string;
  defaultShippingMethod?: string;
  defaultDocumentDiscountPercent?: number;
  defaultTaxRate?: number;
  internalNotes?: string;
  isActive?: boolean;
  contacts?: ContactInput[];
};
