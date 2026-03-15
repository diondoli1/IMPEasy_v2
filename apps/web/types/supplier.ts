export type Supplier = {
  id: number;
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  paymentTerm: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplierInput = {
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  paymentTerm?: string;
  isActive?: boolean;
};

export type ItemVendorTerm = {
  id: number;
  itemId: number;
  itemCode: string | null;
  itemName: string;
  supplierId: number;
  supplierCode: string | null;
  supplierName: string;
  vendorItemCode: string | null;
  leadTimeDays: number;
  unitPrice: number;
  minimumQuantity: number;
  isPreferred: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemVendorTermInput = {
  itemId: number;
  vendorItemCode?: string;
  leadTimeDays?: number;
  unitPrice?: number;
  minimumQuantity?: number;
  isPreferred?: boolean;
  notes?: string;
};

export type SupplierDetail = Supplier & {
  itemVendorTerms: ItemVendorTerm[];
  purchaseOrders: import('./purchase-order').PurchaseOrder[];
};
