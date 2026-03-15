import type { CustomerAddress } from './customer';
import type { Quote } from './quote';

export type SalesOrderTaxMode = 'exclusive' | 'inclusive';

export type SalesOrder = {
  id: number;
  quoteId: number;
  customerId: number;
  customerName: string;
  customerCode: string | null;
  documentNumber: string;
  status: string;
  orderDate: string;
  promisedDate: string | null;
  customerReference: string | null;
  salespersonName: string | null;
  salespersonEmail: string | null;
  paymentTerm: string | null;
  shippingTerm: string | null;
  shippingMethod: string | null;
  taxMode: SalesOrderTaxMode;
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
  createdAt: string;
  updatedAt: string;
};

export type SalesOrderStatusTransition =
  | 'confirmed'
  | 'released'
  | 'in_production'
  | 'shipped'
  | 'invoiced'
  | 'closed';

export type SalesOrderStatusTransitionInput = {
  status: SalesOrderStatusTransition;
};

export type SalesOrderLine = {
  id: number;
  salesOrderId: number;
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

export type SalesOrderLineInput = {
  itemId: number;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  lineDiscountPercent?: number;
  taxRate?: number;
  deliveryDateOverride?: string;
};

export type SalesOrderInput = {
  customerId?: number;
  orderDate?: string;
  promisedDate?: string;
  customerReference?: string;
  salespersonName?: string;
  salespersonEmail?: string;
  paymentTerm?: string;
  shippingTerm?: string;
  shippingMethod?: string;
  taxMode?: SalesOrderTaxMode;
  documentDiscountPercent?: number;
  notes?: string;
  internalNotes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
  lines?: SalesOrderLineInput[];
};

export type SalesOrderDetail = SalesOrder & {
  salesOrderLines: SalesOrderLine[];
};

export type QuoteConversionResponse = {
  quote: Quote;
  salesOrder: SalesOrder;
};

export type SalesOrderAudit = {
  id: number;
  salesOrderId: number;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  actor: string;
  createdAt: string;
};

export type OrderStatusDashboardShipmentCounts = {
  draft: number;
  packed: number;
  shipped: number;
  delivered: number;
};

export type OrderStatusDashboardInvoiceCounts = {
  issued: number;
  paid: number;
};

export type OrderStatusDashboardRow = {
  salesOrderId: number;
  quoteId: number;
  customerId: number;
  customerName: string;
  salesOrderStatus: string;
  lineCount: number;
  orderedQuantity: number;
  workOrdersGenerated: number;
  workOrdersExpected: number;
  openOperationCount: number;
  completedOperationCount: number;
  pendingInspectionCount: number;
  qualityClearedQuantity: number;
  shipmentCounts: OrderStatusDashboardShipmentCounts;
  invoiceCounts: OrderStatusDashboardInvoiceCounts;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusDashboardSummary = {
  totalOrders: number;
  draftCount: number;
  confirmedCount: number;
  releasedCount: number;
  inProductionCount: number;
  shippedCount: number;
  invoicedCount: number;
  closedCount: number;
};

export type OrderStatusDashboardResponse = {
  summary: OrderStatusDashboardSummary;
  orders: OrderStatusDashboardRow[];
};

export type SalesReportSummary = {
  totalSalesOrders: number;
  totalOrderedQuantity: number;
  totalOrderedAmount: number;
  totalShippedQuantity: number;
  totalShippedAmount: number;
  totalInvoiceIssuedAmount: number;
  totalInvoicePaidAmount: number;
  totalOutstandingInvoiceAmount: number;
};

export type SalesReportRow = {
  salesOrderId: number;
  quoteId: number;
  customerId: number;
  customerName: string;
  salesOrderStatus: string;
  orderedQuantity: number;
  orderedAmount: number;
  shippedQuantity: number;
  shippedAmount: number;
  invoiceIssuedAmount: number;
  invoicePaidAmount: number;
  outstandingInvoiceAmount: number;
  shipmentCount: number;
  deliveredShipmentCount: number;
  invoiceIssuedCount: number;
  invoicePaidCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SalesReportResponse = {
  summary: SalesReportSummary;
  orders: SalesReportRow[];
};
