export type PurchaseOrderLine = {
  id: number;
  purchaseOrderId: number;
  itemId: number;
  itemCode: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  receivedQuantity: number;
  remainingQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderLineInput = {
  itemId: number;
  quantity: number;
  unitPrice: number;
};

export type PurchaseOrderLineReceiptInput = {
  quantity: number;
  existingLotId?: number;
  lotNumber?: string;
  receiptDate?: string;
  notes?: string;
};
