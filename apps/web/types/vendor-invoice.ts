export type VendorInvoice = {
  id: number;
  number: string | null;
  vendorInvoiceId: string | null;
  invoiceDate: string;
  supplierId: number;
  supplierCode: string | null;
  supplierName: string;
  purchaseOrderId: number | null;
  purchaseOrderNumber: string | null;
  totalAmount: number;
  taxAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};
