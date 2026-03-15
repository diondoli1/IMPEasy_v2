export type InvoiceLine = {
  id: number;
  invoiceId: number;
  shipmentLineId: number;
  salesOrderLineId: number;
  itemId: number;
  itemCode: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: number;
  number: string;
  shipmentId: number;
  shipmentNumber: string;
  salesOrderId: number;
  salesOrderNumber: string;
  customerId: number;
  customerName: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  invoiceLines: InvoiceLine[];
};

export type InvoiceRegisterEntry = {
  id: number;
  number: string;
  customerId: number;
  customerName: string;
  salesOrderId: number;
  salesOrderNumber: string;
  shipmentId: number;
  shipmentNumber: string;
  status: string;
  totalAmount: number;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
};

export type CreateInvoiceLineInput = {
  salesOrderLineId: number;
  quantity: number;
  unitPrice: number;
};

export type CreateInvoiceInput = {
  salesOrderId: number;
  customerId: number;
  invoiceType?: 'quotation' | 'invoice' | 'proforma_invoice';
  status?: 'unpaid' | 'paid' | 'dummy';
  issueDate?: string;
  dueDate?: string;
  billingStreet?: string;
  billingCity?: string;
  billingPostcode?: string;
  billingStateRegion?: string;
  billingCountry?: string;
  notes?: string;
  lines: CreateInvoiceLineInput[];
};
