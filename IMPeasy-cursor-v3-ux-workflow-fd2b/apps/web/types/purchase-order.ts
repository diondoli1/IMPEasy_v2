export type PurchaseOrder = {
  id: number;
  number: string;
  supplierId: number;
  supplierCode: string | null;
  supplierName: string;
  status: string;
  supplierReference: string | null;
  orderDate: string;
  expectedDate: string | null;
  buyer: string | null;
  currency: string;
  paymentTerm: string | null;
  openQuantity: number;
  receivedQuantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderInput = {
  supplierId: number;
  supplierReference?: string;
  orderDate?: string;
  expectedDate?: string;
  buyer?: string;
  currency?: string;
  paymentTerm?: string;
  notes?: string;
};

export type PurchaseOrderReceipt = {
  id: number;
  purchaseOrderLineId: number;
  stockLotId: number | null;
  lotNumber: string | null;
  quantity: number;
  receiptDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderHistoryEntry = {
  eventType: string;
  message: string;
  eventDate: string;
};

export type PurchaseOrderDetail = PurchaseOrder & {
  lines: import('./purchase-order-line').PurchaseOrderLine[];
  receipts: PurchaseOrderReceipt[];
  history: PurchaseOrderHistoryEntry[];
};
