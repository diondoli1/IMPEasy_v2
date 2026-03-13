import type { Customer, CustomerInput } from '../types/customer';
import type { Contact, ContactInput } from '../types/contact';
import type {
  AuthRole,
  AuthTokenResponse,
  AuthUser,
  CreateRoleInput,
  LoginUserInput,
  ReplaceUserRolesInput,
  RegisterUserInput,
} from '../types/auth';
import type {
  Inspection,
  InspectionInput,
  InspectionResultInput,
  InspectionScrapInput,
} from '../types/inspection';
import type { Item, ItemInput } from '../types/item';
import type { Quote, QuoteInput, QuoteStatusTransitionInput } from '../types/quote';
import type { QuoteLine, QuoteLineInput } from '../types/quote-line';
import type {
  Bom,
  BomInput,
  BomItem,
  BomItemInput,
  BomItemUpdateInput,
  BomLinkResponse,
  BomUpdateInput,
} from '../types/bom';
import type {
  Routing,
  RoutingInput,
  RoutingLinkResponse,
  RoutingOperation,
  RoutingOperationInput,
  RoutingOperationUpdateInput,
  RoutingUpdateInput,
} from '../types/routing';
import type {
  QuoteConversionResponse,
  OrderStatusDashboardResponse,
  SalesReportResponse,
  SalesOrder,
  SalesOrderAudit,
  SalesOrderDetail,
  SalesOrderInput,
  SalesOrderStatusTransitionInput,
} from '../types/sales-order';
import type {
  Shipment,
  ShipmentDetail,
  ShipmentInput,
  ShipmentPickInput,
  ShipmentUpdateInput,
  ShippingAvailabilityLine,
} from '../types/shipment';
import type {
  ProductionPerformanceDashboardResponse,
  WorkOrder,
  WorkOrderDetail,
} from '../types/work-order';
import type {
  OperationDetail,
  OperationCompletionInput,
  OperationQueueEntry,
  OperationUpdateInput,
  ProductionLog,
  ProductionLogInput,
} from '../types/operation';
import type {
  ManufacturingOrder,
  ManufacturingOrderDetail,
  ManufacturingOrderInput,
  MaterialBookingInput,
  MaterialBookingUpdateInput,
} from '../types/manufacturing-order';
import type {
  CriticalOnHandItem,
  InventoryAdjustmentInput,
  InventoryItem,
  InventoryItemInput,
  InventorySummaryReportResponse,
  InventoryTransaction,
  MaterialIssueInput,
  StockItem,
  StockItemDetail,
  StockLot,
  StockLotDetail,
  StockMovement,
} from '../types/inventory';
import type { Invoice, InvoiceRegisterEntry } from '../types/invoice';
import type {
  ItemVendorTerm,
  ItemVendorTermInput,
  Supplier,
  SupplierDetail,
  SupplierInput,
} from '../types/supplier';
import type {
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderInput,
} from '../types/purchase-order';
import type {
  PurchaseOrderLine,
  PurchaseOrderLineInput,
  PurchaseOrderLineReceiptInput,
} from '../types/purchase-order-line';
import type { ModuleDashboardResponse } from '../types/dashboard';
import type {
  CompanySetting,
  CompanySettingInput,
  DocumentTemplateSetting,
  DocumentTemplateSettingInput,
  DocumentTemplateType,
  NumberingSetting,
  NumberingSettingInput,
  SettingsListEntry,
  SettingsListEntryInput,
  SettingsListEntryUpdateInput,
  SettingsListType,
} from '../types/settings';
import { getAuthToken } from './auth-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const nativeFetch: typeof fetch = (...args) => globalThis.fetch(...args);

function withAuthHeaders(headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers);
  const token = getAuthToken();

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  return requestHeaders;
}

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  return nativeFetch(input, {
    ...init,
    headers: withAuthHeaders(init.headers),
  });
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Request failed with ${response.status}`);
  }

  return response.json();
}

async function assertOkOrThrow(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  const payload = await response.text();
  throw new Error(payload || `Request failed with ${response.status}`);
}

export async function registerUser(input: RegisterUserInput): Promise<AuthUser> {
  const response = await apiFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<AuthUser>;
}

export async function loginUser(input: LoginUserInput): Promise<AuthTokenResponse> {
  const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<AuthTokenResponse>;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch(`${API_BASE_URL}/auth/me`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<AuthUser>;
}

export async function listAuthUsers(): Promise<AuthUser[]> {
  const response = await apiFetch(`${API_BASE_URL}/auth/users`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<AuthUser[]>;
}

export async function listAuthRoles(): Promise<AuthRole[]> {
  const response = await apiFetch(`${API_BASE_URL}/auth/roles`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<AuthRole[]>;
}

export async function createAuthRole(input: CreateRoleInput): Promise<AuthRole> {
  const response = await apiFetch(`${API_BASE_URL}/auth/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<AuthRole>;
}

export async function replaceAuthUserRoles(
  userId: number,
  input: ReplaceUserRolesInput,
): Promise<AuthUser> {
  const response = await apiFetch(`${API_BASE_URL}/auth/users/${userId}/roles`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<AuthUser>;
}

export async function listCustomers(): Promise<Customer[]> {
  const response = await apiFetch(`${API_BASE_URL}/customers`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Customer[]>;
}

export async function getCustomer(id: number): Promise<Customer> {
  const response = await apiFetch(`${API_BASE_URL}/customers/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Customer>;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const response = await apiFetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Customer>;
}

export async function updateCustomer(id: number, input: Partial<CustomerInput>): Promise<Customer> {
  const response = await apiFetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Customer>;
}

export async function listContactsByCustomer(customerId: number): Promise<Contact[]> {
  const response = await apiFetch(`${API_BASE_URL}/customers/${customerId}/contacts`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<Contact[]>;
}

export async function getContact(id: number): Promise<Contact> {
  const response = await apiFetch(`${API_BASE_URL}/contacts/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Contact>;
}

export async function createContact(customerId: number, input: ContactInput): Promise<Contact> {
  const response = await apiFetch(`${API_BASE_URL}/customers/${customerId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Contact>;
}

export async function updateContact(id: number, input: Partial<ContactInput>): Promise<Contact> {
  const response = await apiFetch(`${API_BASE_URL}/contacts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Contact>;
}

export async function listItems(): Promise<Item[]> {
  const response = await apiFetch(`${API_BASE_URL}/items`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Item[]>;
}

export async function getItem(id: number): Promise<Item> {
  const response = await apiFetch(`${API_BASE_URL}/items/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Item>;
}

export async function createItem(input: ItemInput): Promise<Item> {
  const response = await apiFetch(`${API_BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Item>;
}

export async function updateItem(id: number, input: Partial<ItemInput>): Promise<Item> {
  const response = await apiFetch(`${API_BASE_URL}/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Item>;
}

export async function listManufacturedItems(): Promise<Item[]> {
  const response = await apiFetch(`${API_BASE_URL}/manufactured-items`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Item[]>;
}

export async function getManufacturedItem(id: number): Promise<Item> {
  const response = await apiFetch(`${API_BASE_URL}/manufactured-items/${id}`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<Item>;
}

export async function createManufacturedItem(input: ItemInput): Promise<Item> {
  const response = await apiFetch(`${API_BASE_URL}/manufactured-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<Item>;
}

export async function updateManufacturedItem(
  id: number,
  input: Partial<ItemInput>,
): Promise<Item> {
  const response = await apiFetch(`${API_BASE_URL}/manufactured-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<Item>;
}

export async function listQuotes(): Promise<Quote[]> {
  const response = await apiFetch(`${API_BASE_URL}/quotes`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Quote[]>;
}

export async function getQuote(id: number): Promise<Quote> {
  const response = await apiFetch(`${API_BASE_URL}/quotes/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Quote>;
}

export async function createQuote(input: QuoteInput): Promise<Quote> {
  const response = await apiFetch(`${API_BASE_URL}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Quote>;
}

export async function updateQuote(id: number, input: QuoteInput): Promise<Quote> {
  const response = await apiFetch(`${API_BASE_URL}/quotes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Quote>;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const response = await apiFetch(`${API_BASE_URL}/suppliers`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Supplier[]>;
}

export async function getSupplier(id: number): Promise<SupplierDetail> {
  const response = await apiFetch(`${API_BASE_URL}/suppliers/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<SupplierDetail>;
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const response = await apiFetch(`${API_BASE_URL}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Supplier>;
}

export async function updateSupplier(id: number, input: Partial<SupplierInput>): Promise<Supplier> {
  const response = await apiFetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Supplier>;
}

export async function listSupplierItemTerms(supplierId: number): Promise<ItemVendorTerm[]> {
  const response = await apiFetch(`${API_BASE_URL}/suppliers/${supplierId}/item-terms`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ItemVendorTerm[]>;
}

export async function createSupplierItemTerm(
  supplierId: number,
  input: ItemVendorTermInput,
): Promise<ItemVendorTerm> {
  const response = await apiFetch(`${API_BASE_URL}/suppliers/${supplierId}/item-terms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<ItemVendorTerm>;
}

export async function listItemVendorTerms(itemId: number): Promise<ItemVendorTerm[]> {
  const response = await apiFetch(`${API_BASE_URL}/items/${itemId}/vendor-terms`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ItemVendorTerm[]>;
}

export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  const response = await apiFetch(`${API_BASE_URL}/purchase-orders`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<PurchaseOrder[]>;
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrderDetail> {
  const response = await apiFetch(`${API_BASE_URL}/purchase-orders/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<PurchaseOrderDetail>;
}

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<PurchaseOrder> {
  const response = await apiFetch(`${API_BASE_URL}/purchase-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<PurchaseOrder>;
}

export async function listPurchaseOrderLines(
  purchaseOrderId: number,
): Promise<PurchaseOrderLine[]> {
  const response = await apiFetch(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/lines`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<PurchaseOrderLine[]>;
}

export async function createPurchaseOrderLine(
  purchaseOrderId: number,
  input: PurchaseOrderLineInput,
): Promise<PurchaseOrderLine> {
  const response = await apiFetch(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<PurchaseOrderLine>;
}

export async function receivePurchaseOrderLine(
  purchaseOrderId: number,
  lineId: number,
  input: PurchaseOrderLineReceiptInput,
): Promise<PurchaseOrderLine> {
  const response = await apiFetch(
    `${API_BASE_URL}/purchase-orders/${purchaseOrderId}/lines/${lineId}/receive`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );

  return parseJsonOrThrow(response) as Promise<PurchaseOrderLine>;
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/inventory-items`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<InventoryItem[]>;
}

export async function getInventoryItem(id: number): Promise<InventoryItem> {
  const response = await apiFetch(`${API_BASE_URL}/inventory-items/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<InventoryItem>;
}

export async function createInventoryItem(input: InventoryItemInput): Promise<InventoryItem> {
  const response = await apiFetch(`${API_BASE_URL}/inventory-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<InventoryItem>;
}

export async function listStockItems(): Promise<StockItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/stock/items`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<StockItem[]>;
}

export async function getStockItem(id: number): Promise<StockItemDetail> {
  const response = await apiFetch(`${API_BASE_URL}/stock/items/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<StockItemDetail>;
}

export async function listStockLots(): Promise<StockLot[]> {
  const response = await apiFetch(`${API_BASE_URL}/stock/lots`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<StockLot[]>;
}

export async function getStockLot(id: number): Promise<StockLotDetail> {
  const response = await apiFetch(`${API_BASE_URL}/stock/lots/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<StockLotDetail>;
}

export async function listStockMovements(): Promise<StockMovement[]> {
  const response = await apiFetch(`${API_BASE_URL}/stock/movements`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<StockMovement[]>;
}

export async function listCriticalOnHand(): Promise<CriticalOnHandItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/stock/critical-on-hand`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<CriticalOnHandItem[]>;
}

export async function listInventoryTransactions(
  inventoryItemId: number,
): Promise<InventoryTransaction[]> {
  const response = await apiFetch(`${API_BASE_URL}/inventory-items/${inventoryItemId}/transactions`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<InventoryTransaction[]>;
}

export async function issueInventoryMaterial(
  inventoryItemId: number,
  input: MaterialIssueInput,
): Promise<InventoryTransaction> {
  const response = await apiFetch(`${API_BASE_URL}/inventory-items/${inventoryItemId}/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<InventoryTransaction>;
}

export async function adjustInventoryItem(
  inventoryItemId: number,
  input: InventoryAdjustmentInput,
): Promise<InventoryTransaction> {
  const response = await apiFetch(`${API_BASE_URL}/inventory-items/${inventoryItemId}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<InventoryTransaction>;
}

export async function updateQuoteStatus(
  id: number,
  input: QuoteStatusTransitionInput,
): Promise<Quote> {
  const response = await apiFetch(`${API_BASE_URL}/quotes/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Quote>;
}

export async function convertQuote(id: number): Promise<QuoteConversionResponse> {
  const response = await apiFetch(`${API_BASE_URL}/quotes/${id}/convert`, {
    method: 'POST',
  });

  return parseJsonOrThrow(response) as Promise<QuoteConversionResponse>;
}

export async function getSalesOrder(id: number): Promise<SalesOrderDetail> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<SalesOrderDetail>;
}

export async function listSalesOrders(): Promise<SalesOrder[]> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<SalesOrder[]>;
}

export async function getOrderStatusDashboard(): Promise<OrderStatusDashboardResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/order-status-dashboard`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<OrderStatusDashboardResponse>;
}

export async function getProductionPerformanceDashboard(): Promise<ProductionPerformanceDashboardResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/production-performance-dashboard`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ProductionPerformanceDashboardResponse>;
}

export async function getInventorySummaryReport(): Promise<InventorySummaryReportResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/inventory-summary`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<InventorySummaryReportResponse>;
}

export async function getSalesReport(): Promise<SalesReportResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/sales-report`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<SalesReportResponse>;
}

export async function updateSalesOrderStatus(
  id: number,
  input: SalesOrderStatusTransitionInput,
): Promise<SalesOrder> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<SalesOrder>;
}

export async function updateSalesOrder(
  id: number,
  input: SalesOrderInput,
): Promise<SalesOrderDetail> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<SalesOrderDetail>;
}

export async function getSalesOrderAuditTrail(id: number): Promise<SalesOrderAudit[]> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${id}/audit`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<SalesOrderAudit[]>;
}

export async function getSalesOrderShippingAvailability(
  salesOrderId: number,
): Promise<ShippingAvailabilityLine[]> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${salesOrderId}/shipping-availability`, {
    cache: 'no-store',
  });
  const payload = (await parseJsonOrThrow(response)) as Array<
    Omit<
      ShippingAvailabilityLine,
      'qualityClearedQuantity' | 'availableToShipQuantity' | 'pendingQualityQuantity'
    >
  >;

  return payload.map((line) => ({
    ...line,
    qualityClearedQuantity: line.availableStockQuantity,
    availableToShipQuantity: Math.max(
      0,
      Math.min(line.remainingQuantity, line.availableStockQuantity),
    ),
    pendingQualityQuantity: 0,
  }));
}

export async function listSalesOrderShipments(salesOrderId: number): Promise<Shipment[]> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${salesOrderId}/shipments`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<Shipment[]>;
}

export async function createShipment(input: ShipmentInput): Promise<Shipment> {
  const response = await apiFetch(`${API_BASE_URL}/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<Shipment>;
}

export async function getShipment(shipmentId: number): Promise<ShipmentDetail> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ShipmentDetail>;
}

export async function updateShipment(
  shipmentId: number,
  input: ShipmentUpdateInput,
): Promise<ShipmentDetail> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<ShipmentDetail>;
}

export async function upsertShipmentPicks(
  shipmentId: number,
  picks: ShipmentPickInput[],
): Promise<ShipmentDetail> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}/picks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ picks }),
  });
  return parseJsonOrThrow(response) as Promise<ShipmentDetail>;
}

export async function pickShipment(shipmentId: number): Promise<Shipment> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}/pick`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<Shipment>;
}

export async function packShipment(shipmentId: number): Promise<Shipment> {
  return pickShipment(shipmentId);
}

export async function shipShipment(shipmentId: number): Promise<Shipment> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}/ship`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<Shipment>;
}

export async function deliverShipment(shipmentId: number): Promise<Shipment> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}/deliver`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<Shipment>;
}

export async function getShipmentInvoice(shipmentId: number): Promise<Invoice | null> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}/invoice`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  return parseJsonOrThrow(response) as Promise<Invoice>;
}

export async function listInvoices(): Promise<InvoiceRegisterEntry[]> {
  const response = await apiFetch(`${API_BASE_URL}/invoices`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<InvoiceRegisterEntry[]>;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const response = await apiFetch(`${API_BASE_URL}/invoices/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Invoice>;
}

export async function createShipmentInvoice(shipmentId: number): Promise<Invoice> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}/invoice`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<Invoice>;
}

export async function payShipmentInvoice(shipmentId: number): Promise<Invoice> {
  const response = await apiFetch(`${API_BASE_URL}/shipments/${shipmentId}/invoice/pay`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<Invoice>;
}

export async function listWorkOrdersBySalesOrder(salesOrderId: number): Promise<WorkOrder[]> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${salesOrderId}/work-orders`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<WorkOrder[]>;
}

export async function getWorkOrder(id: number): Promise<WorkOrderDetail> {
  const response = await apiFetch(`${API_BASE_URL}/work-orders/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<WorkOrderDetail>;
}

export async function generateWorkOrdersForSalesOrder(salesOrderId: number): Promise<WorkOrder[]> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${salesOrderId}/work-orders/generate`, {
    method: 'POST',
  });

  return parseJsonOrThrow(response) as Promise<WorkOrder[]>;
}

export async function listOperationQueue(): Promise<OperationQueueEntry[]> {
  const response = await apiFetch(`${API_BASE_URL}/operations/queue`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<OperationQueueEntry[]>;
}

export async function getOperation(id: number): Promise<OperationDetail> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<OperationDetail>;
}

export async function getOperationInspection(operationId: number): Promise<Inspection | null> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${operationId}/inspection`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  return parseJsonOrThrow(response) as Promise<Inspection>;
}

export async function createOperationInspection(
  operationId: number,
  input: InspectionInput,
): Promise<Inspection> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${operationId}/inspection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Inspection>;
}

export async function recordOperationInspectionResult(
  operationId: number,
  input: InspectionResultInput,
): Promise<Inspection> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${operationId}/inspection/result`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Inspection>;
}

export async function createOperationInspectionRework(operationId: number): Promise<Inspection> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${operationId}/inspection/rework`, {
    method: 'POST',
  });

  return parseJsonOrThrow(response) as Promise<Inspection>;
}

export async function recordOperationInspectionScrap(
  operationId: number,
  input: InspectionScrapInput,
): Promise<Inspection> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${operationId}/inspection/scrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Inspection>;
}

export async function listOperationProductionLogs(operationId: number): Promise<ProductionLog[]> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${operationId}/logs`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<ProductionLog[]>;
}

export async function createOperationProductionLog(
  operationId: number,
  input: ProductionLogInput,
): Promise<ProductionLog> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${operationId}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<ProductionLog>;
}

export async function startOperation(id: number): Promise<OperationDetail> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${id}/start`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<OperationDetail>;
}

export async function pauseOperation(id: number): Promise<OperationDetail> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${id}/pause`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<OperationDetail>;
}

export async function completeOperation(
  id: number,
  input?: OperationCompletionInput,
): Promise<OperationDetail> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input ?? {}),
  });
  return parseJsonOrThrow(response) as Promise<OperationDetail>;
}

export async function updateOperation(
  id: number,
  input: OperationUpdateInput,
): Promise<OperationDetail> {
  const response = await apiFetch(`${API_BASE_URL}/operations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<OperationDetail>;
}

export async function listManufacturingOrders(): Promise<ManufacturingOrder[]> {
  const response = await apiFetch(`${API_BASE_URL}/manufacturing-orders`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ManufacturingOrder[]>;
}

export async function getManufacturingOrder(id: number): Promise<ManufacturingOrderDetail> {
  const response = await apiFetch(`${API_BASE_URL}/manufacturing-orders/${id}`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ManufacturingOrderDetail>;
}

export async function updateManufacturingOrder(
  id: number,
  input: ManufacturingOrderInput,
): Promise<ManufacturingOrderDetail> {
  const response = await apiFetch(`${API_BASE_URL}/manufacturing-orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<ManufacturingOrderDetail>;
}

export async function releaseManufacturingOrder(
  id: number,
): Promise<ManufacturingOrderDetail> {
  const response = await apiFetch(`${API_BASE_URL}/manufacturing-orders/${id}/release`, {
    method: 'POST',
  });
  return parseJsonOrThrow(response) as Promise<ManufacturingOrderDetail>;
}

export async function createOrUpdateMaterialBooking(
  manufacturingOrderId: number,
  input: MaterialBookingInput,
): Promise<ManufacturingOrderDetail> {
  const response = await apiFetch(
    `${API_BASE_URL}/manufacturing-orders/${manufacturingOrderId}/bookings`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
  return parseJsonOrThrow(response) as Promise<ManufacturingOrderDetail>;
}

export async function updateManufacturingOrderMaterialBooking(
  manufacturingOrderId: number,
  bookingId: number,
  input: MaterialBookingUpdateInput,
): Promise<ManufacturingOrderDetail> {
  const response = await apiFetch(
    `${API_BASE_URL}/manufacturing-orders/${manufacturingOrderId}/bookings/${bookingId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
  return parseJsonOrThrow(response) as Promise<ManufacturingOrderDetail>;
}

export async function listManufacturingOrdersBySalesOrder(
  salesOrderId: number,
): Promise<ManufacturingOrder[]> {
  const response = await apiFetch(`${API_BASE_URL}/sales-orders/${salesOrderId}/work-orders`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ManufacturingOrder[]>;
}

export async function generateManufacturingOrdersForSalesOrder(
  salesOrderId: number,
): Promise<ManufacturingOrder[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/sales-orders/${salesOrderId}/work-orders/generate`,
    {
      method: 'POST',
    },
  );

  return parseJsonOrThrow(response) as Promise<ManufacturingOrder[]>;
}

export async function listBomsByItem(itemId: number): Promise<Bom[]> {
  const response = await apiFetch(`${API_BASE_URL}/boms/item/${itemId}`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<Bom[]>;
}

export async function getBom(id: number): Promise<Bom> {
  const response = await apiFetch(`${API_BASE_URL}/boms/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Bom>;
}

export async function createBom(input: BomInput): Promise<Bom> {
  const response = await apiFetch(`${API_BASE_URL}/boms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Bom>;
}

export async function updateBom(id: number, input: BomUpdateInput): Promise<Bom> {
  const response = await apiFetch(`${API_BASE_URL}/boms/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Bom>;
}

export async function setBomAsDefault(bomId: number): Promise<BomLinkResponse> {
  const response = await apiFetch(`${API_BASE_URL}/boms/${bomId}/default`, {
    method: 'PATCH',
  });

  return parseJsonOrThrow(response) as Promise<BomLinkResponse>;
}

export async function getRouting(id: number): Promise<Routing> {
  const response = await apiFetch(`${API_BASE_URL}/routings/${id}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<Routing>;
}

export async function createRouting(input: RoutingInput): Promise<Routing> {
  const response = await apiFetch(`${API_BASE_URL}/routings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Routing>;
}

export async function updateRouting(id: number, input: RoutingUpdateInput): Promise<Routing> {
  const response = await apiFetch(`${API_BASE_URL}/routings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<Routing>;
}

export async function listRoutingsByItem(itemId: number): Promise<Routing[]> {
  const response = await apiFetch(`${API_BASE_URL}/routings/item/${itemId}`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<Routing[]>;
}

export async function setRoutingAsDefault(routingId: number): Promise<RoutingLinkResponse> {
  const response = await apiFetch(`${API_BASE_URL}/routings/${routingId}/default`, {
    method: 'PATCH',
  });

  return parseJsonOrThrow(response) as Promise<RoutingLinkResponse>;
}

export async function listRoutingOperations(routingId: number): Promise<RoutingOperation[]> {
  const response = await apiFetch(`${API_BASE_URL}/routings/${routingId}/operations`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<RoutingOperation[]>;
}

export async function createRoutingOperation(
  routingId: number,
  input: RoutingOperationInput,
): Promise<RoutingOperation> {
  const response = await apiFetch(`${API_BASE_URL}/routings/${routingId}/operations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<RoutingOperation>;
}

export async function updateRoutingOperation(
  routingId: number,
  operationId: number,
  input: RoutingOperationUpdateInput,
): Promise<RoutingOperation> {
  const response = await apiFetch(`${API_BASE_URL}/routings/${routingId}/operations/${operationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<RoutingOperation>;
}

export async function listBomItems(bomId: number): Promise<BomItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/boms/${bomId}/items`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<BomItem[]>;
}

export async function createBomItem(bomId: number, input: BomItemInput): Promise<BomItem> {
  const response = await apiFetch(`${API_BASE_URL}/boms/${bomId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<BomItem>;
}

export async function updateBomItem(
  bomId: number,
  bomItemId: number,
  input: BomItemUpdateInput,
): Promise<BomItem> {
  const response = await apiFetch(`${API_BASE_URL}/boms/${bomId}/items/${bomItemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<BomItem>;
}

export async function listQuoteLines(quoteId: number): Promise<QuoteLine[]> {
  const response = await apiFetch(`${API_BASE_URL}/quotes/${quoteId}/lines`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<QuoteLine[]>;
}

export async function createQuoteLine(
  quoteId: number,
  input: QuoteLineInput,
): Promise<QuoteLine> {
  const response = await apiFetch(`${API_BASE_URL}/quotes/${quoteId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<QuoteLine>;
}

function getSettingsListPath(listType: SettingsListType): string {
  switch (listType) {
    case 'payment_terms':
      return 'payment-terms';
    case 'shipping_terms':
      return 'shipping-terms';
    case 'shipping_methods':
      return 'shipping-methods';
    case 'tax_rates':
      return 'tax-rates';
    default:
      return 'payment-terms';
  }
}

export async function getCompanySettings(): Promise<CompanySetting> {
  const response = await apiFetch(`${API_BASE_URL}/settings/company`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<CompanySetting>;
}

export async function updateCompanySettings(input: CompanySettingInput): Promise<CompanySetting> {
  const response = await apiFetch(`${API_BASE_URL}/settings/company`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<CompanySetting>;
}

export async function listNumberingSettings(): Promise<NumberingSetting[]> {
  const response = await apiFetch(`${API_BASE_URL}/settings/numbering`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<NumberingSetting[]>;
}

export async function replaceNumberingSettings(
  settings: NumberingSettingInput[],
): Promise<NumberingSetting[]> {
  const response = await apiFetch(`${API_BASE_URL}/settings/numbering`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  return parseJsonOrThrow(response) as Promise<NumberingSetting[]>;
}

export async function listSettingsEntries(listType: SettingsListType): Promise<SettingsListEntry[]> {
  const path = getSettingsListPath(listType);
  const response = await apiFetch(`${API_BASE_URL}/settings/${path}`, { cache: 'no-store' });
  return parseJsonOrThrow(response) as Promise<SettingsListEntry[]>;
}

export async function createSettingsEntry(
  listType: SettingsListType,
  input: SettingsListEntryInput,
): Promise<SettingsListEntry> {
  const path = getSettingsListPath(listType);
  const response = await apiFetch(`${API_BASE_URL}/settings/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<SettingsListEntry>;
}

export async function updateSettingsEntry(
  listType: SettingsListType,
  id: number,
  input: SettingsListEntryUpdateInput,
): Promise<SettingsListEntry> {
  const path = getSettingsListPath(listType);
  const response = await apiFetch(`${API_BASE_URL}/settings/${path}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<SettingsListEntry>;
}

export async function deleteSettingsEntry(listType: SettingsListType, id: number): Promise<void> {
  const path = getSettingsListPath(listType);
  const response = await apiFetch(`${API_BASE_URL}/settings/${path}/${id}`, {
    method: 'DELETE',
  });
  await assertOkOrThrow(response);
}

export async function listDocumentTemplates(): Promise<DocumentTemplateSetting[]> {
  const response = await apiFetch(`${API_BASE_URL}/settings/document-templates`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<DocumentTemplateSetting[]>;
}

export async function updateDocumentTemplate(
  templateType: DocumentTemplateType,
  input: DocumentTemplateSettingInput,
): Promise<DocumentTemplateSetting> {
  const response = await apiFetch(`${API_BASE_URL}/settings/document-templates/${templateType}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response) as Promise<DocumentTemplateSetting>;
}

export async function getCustomerOrdersDashboard(): Promise<ModuleDashboardResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/dashboards/customer-orders`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ModuleDashboardResponse>;
}

export async function getProductionDashboard(): Promise<ModuleDashboardResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/dashboards/production`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ModuleDashboardResponse>;
}

export async function getInventoryDashboard(): Promise<ModuleDashboardResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/dashboards/inventory`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ModuleDashboardResponse>;
}

export async function getPurchasingDashboard(): Promise<ModuleDashboardResponse> {
  const response = await apiFetch(`${API_BASE_URL}/reporting/dashboards/purchasing`, {
    cache: 'no-store',
  });
  return parseJsonOrThrow(response) as Promise<ModuleDashboardResponse>;
}




