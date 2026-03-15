export type QuoteLine = {
  id: number;
  quoteId: number;
  itemId: number;
  itemCode: string | null;
  itemName: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineDiscountPercent: number;
  taxRate: number;
  deliveryDateOverride: string | null;
  lineTotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuoteLineInput = {
  itemId: number;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  lineDiscountPercent?: number;
  taxRate?: number;
  deliveryDateOverride?: string;
};
