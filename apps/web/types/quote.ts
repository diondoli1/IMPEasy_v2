import type { CustomerAddress } from './customer';
import type { QuoteLine, QuoteLineInput } from './quote-line';

export type QuoteTaxMode = 'exclusive' | 'inclusive';

export type Quote = {
  id: number;
  customerId: number;
  customerName: string;
  customerCode: string | null;
  documentNumber: string;
  status: string;
  quoteDate: string;
  validityDate: string | null;
  promisedDate: string | null;
  customerReference: string | null;
  salespersonName: string | null;
  salespersonEmail: string | null;
  paymentTerm: string | null;
  shippingTerm: string | null;
  shippingMethod: string | null;
  taxMode: QuoteTaxMode;
  documentDiscountPercent: number;
  notes: string | null;
  internalNotes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  linkedSalesOrderId: number | null;
  quoteLines?: QuoteLine[];
  createdAt: string;
  updatedAt: string;
};

export type QuoteStatusForCreate = 'draft' | 'sent' | 'approved';

export type QuoteInput = {
  customerId: number;
  status?: QuoteStatusForCreate;
  quoteDate?: string;
  validityDate?: string;
  promisedDate?: string;
  customerReference?: string;
  salespersonName?: string;
  salespersonEmail?: string;
  paymentTerm?: string;
  shippingTerm?: string;
  shippingMethod?: string;
  taxMode?: QuoteTaxMode;
  documentDiscountPercent?: number;
  notes?: string;
  internalNotes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
  lines?: QuoteLineInput[];
};

export type QuoteStatusTransition = 'sent' | 'approved' | 'rejected';

export type QuoteStatusTransitionInput = {
  status: QuoteStatusTransition;
};
