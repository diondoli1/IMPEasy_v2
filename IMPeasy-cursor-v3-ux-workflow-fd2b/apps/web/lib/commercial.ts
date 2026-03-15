import type { AuthUser } from '../types/auth';
import type { Customer, CustomerAddress, CustomerInput } from '../types/customer';
import type { Item } from '../types/item';
import type { Quote, QuoteInput, QuoteTaxMode } from '../types/quote';
import type { QuoteLine, QuoteLineInput } from '../types/quote-line';
import type {
  SalesOrder,
  SalesOrderDetail,
  SalesOrderInput,
  SalesOrderLine,
  SalesOrderLineInput,
  SalesOrderTaxMode,
} from '../types/sales-order';

export type CustomerOrderWorkspaceKind = 'quote' | 'sales-order';

export type CommercialEditableLine = {
  key: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  itemGroup: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineDiscountPercent: number;
  taxRate: number;
  deliveryDateOverride: string;
  lineTotal: number;
  taxAmount: number;
  totalAmount: number;
};

export type CommercialDocumentTotals = {
  lines: CommercialEditableLine[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export const PAYMENT_TERM_OPTIONS = ['Due on receipt', 'Net 15', 'Net 30'];
export const SHIPPING_TERM_OPTIONS = ['EXW', 'FCA', 'DAP'];
export const SHIPPING_METHOD_OPTIONS = ['Customer pickup', 'Courier', 'Freight'];
export const TAX_RATE_OPTIONS = [0, 7, 19];
export const TAX_MODE_OPTIONS: Array<{ value: QuoteTaxMode; label: string }> = [
  { value: 'exclusive', label: 'Tax exclusive' },
  { value: 'inclusive', label: 'Tax inclusive' },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

export function createEmptyAddress(): CustomerAddress {
  return {
    street: '',
    city: '',
    postcode: '',
    stateRegion: '',
    country: '',
  };
}

export const CUSTOMER_STATUS_OPTIONS = [
  { value: 'no_contact', label: 'No contact' },
  { value: 'no_interest', label: 'No Interest' },
  { value: 'interested', label: 'Interested' },
  { value: 'permanent_buyer', label: 'Permanent Buyer' },
] as const;

export function createBlankCustomerInput(): Required<CustomerInput> {
  return {
    code: '',
    name: '',
    status: 'no_contact',
    regNo: '',
    email: '',
    phone: '',
    vatNumber: '',
    website: '',
    contactStarted: '',
    nextContact: '',
    billingAddress: createEmptyAddress(),
    shippingAddress: createEmptyAddress(),
    defaultPaymentTerm: PAYMENT_TERM_OPTIONS[1],
    defaultShippingTerm: SHIPPING_TERM_OPTIONS[0],
    defaultShippingMethod: SHIPPING_METHOD_OPTIONS[0],
    defaultDocumentDiscountPercent: 0,
    defaultTaxRate: TAX_RATE_OPTIONS[2],
    internalNotes: '',
    isActive: true,
    contacts: [],
  };
}

export function getCustomerStatusLabel(status: string | null | undefined): string {
  if (!status) return 'No contact';
  const opt = CUSTOMER_STATUS_OPTIONS.find((o) => o.value === status);
  return opt?.label ?? status;
}

export function createEditableLine(items: Item[], line?: QuoteLine | SalesOrderLine): CommercialEditableLine {
  const item = line ? items.find((candidate) => candidate.id === line.itemId) : null;

  return {
    key: `${line?.itemId ?? 'new'}-${Math.random().toString(16).slice(2, 8)}`,
    itemId: line?.itemId ?? items[0]?.id ?? 0,
    itemCode: line?.itemCode ?? (items[0] ? formatItemCode(items[0].id) : ''),
    itemName: line?.itemName ?? items[0]?.name ?? '',
    itemGroup: item?.itemGroup ?? items[0]?.itemGroup ?? '',
    description: line?.description ?? item?.description ?? item?.name ?? '',
    quantity: line?.quantity ?? 1,
    unit: line?.unit ?? 'pcs',
    unitPrice: line?.unitPrice ?? 0,
    lineDiscountPercent: line?.lineDiscountPercent ?? 0,
    taxRate: line?.taxRate ?? TAX_RATE_OPTIONS[2],
    deliveryDateOverride: toDateInputValue(line?.deliveryDateOverride),
    lineTotal: line?.lineTotal ?? 0,
    taxAmount: line?.taxAmount ?? 0,
    totalAmount: line?.totalAmount ?? 0,
  };
}

export function formatItemCode(itemId: number): string {
  return `ITEM-${String(itemId).padStart(4, '0')}`;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateCommercialDocument(input: {
  lines: CommercialEditableLine[];
  taxMode: QuoteTaxMode | SalesOrderTaxMode;
  documentDiscountPercent: number;
}): CommercialDocumentTotals {
  const discountedBaseLines = input.lines.map((line) => {
    const baseAmount = roundCurrency(line.quantity * line.unitPrice);
    const discountedBaseAmount = roundCurrency(
      baseAmount * (1 - line.lineDiscountPercent / 100),
    );

    return {
      ...line,
      discountedBaseAmount,
    };
  });

  const discountedBaseTotal = roundCurrency(
    discountedBaseLines.reduce((sum, line) => sum + line.discountedBaseAmount, 0),
  );
  const documentDiscountAmount = roundCurrency(
    discountedBaseTotal * (input.documentDiscountPercent / 100),
  );

  let remainingDiscount = documentDiscountAmount;

  const lines = discountedBaseLines.map((line, index) => {
    const isLastLine = index === discountedBaseLines.length - 1;
    const proportionalDiscount =
      discountedBaseTotal > 0
        ? roundCurrency((documentDiscountAmount * line.discountedBaseAmount) / discountedBaseTotal)
        : 0;
    const allocatedDiscount = isLastLine ? remainingDiscount : proportionalDiscount;
    remainingDiscount = roundCurrency(remainingDiscount - allocatedDiscount);

    const discountedAmount = roundCurrency(line.discountedBaseAmount - allocatedDiscount);
    const taxAmount =
      input.taxMode === 'inclusive'
        ? roundCurrency(
            line.taxRate > 0 ? (discountedAmount * line.taxRate) / (100 + line.taxRate) : 0,
          )
        : roundCurrency((discountedAmount * line.taxRate) / 100);
    const lineTotal =
      input.taxMode === 'inclusive'
        ? roundCurrency(discountedAmount - taxAmount)
        : discountedAmount;
    const totalAmount =
      input.taxMode === 'inclusive'
        ? discountedAmount
        : roundCurrency(lineTotal + taxAmount);

    return {
      ...line,
      lineTotal,
      taxAmount,
      totalAmount,
    };
  });

  return {
    lines,
    subtotalAmount: roundCurrency(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
    discountAmount: documentDiscountAmount,
    taxAmount: roundCurrency(lines.reduce((sum, line) => sum + line.taxAmount, 0)),
    totalAmount: roundCurrency(lines.reduce((sum, line) => sum + line.totalAmount, 0)),
  };
}

export function workspaceIdForDocument(kind: CustomerOrderWorkspaceKind, id: number): string {
  return `${kind}-${id}`;
}

export function parseWorkspaceId(value: string): {
  kind: CustomerOrderWorkspaceKind | 'new' | null;
  id: number | null;
} {
  if (value === 'new') {
    return { kind: 'new', id: null };
  }

  if (value.startsWith('quote-')) {
    const id = Number(value.replace('quote-', ''));
    return Number.isFinite(id) ? { kind: 'quote', id } : { kind: null, id: null };
  }

  if (value.startsWith('sales-order-')) {
    const id = Number(value.replace('sales-order-', ''));
    return Number.isFinite(id) ? { kind: 'sales-order', id } : { kind: null, id: null };
  }

  return { kind: null, id: null };
}

export function getPrimaryContact(customer: Customer | null | undefined) {
  return customer?.contacts.find((contact) => contact.isPrimary) ?? customer?.contacts[0] ?? null;
}

export function hydrateQuoteInput(quote: Quote): Required<QuoteInput> {
  return {
    customerId: quote.customerId,
    quoteDate: toDateInputValue(quote.quoteDate),
    validityDate: toDateInputValue(quote.validityDate),
    promisedDate: toDateInputValue(quote.promisedDate),
    customerReference: quote.customerReference ?? '',
    salespersonName: quote.salespersonName ?? '',
    salespersonEmail: quote.salespersonEmail ?? '',
    paymentTerm: quote.paymentTerm ?? '',
    shippingTerm: quote.shippingTerm ?? '',
    shippingMethod: quote.shippingMethod ?? '',
    taxMode: quote.taxMode,
    documentDiscountPercent: quote.documentDiscountPercent,
    notes: quote.notes ?? '',
    internalNotes: quote.internalNotes ?? '',
    contactName: quote.contactName ?? '',
    contactEmail: quote.contactEmail ?? '',
    contactPhone: quote.contactPhone ?? '',
    billingAddress: quote.billingAddress ?? createEmptyAddress(),
    shippingAddress: quote.shippingAddress ?? createEmptyAddress(),
    lines:
      quote.quoteLines?.map((line) => ({
        itemId: line.itemId,
        description: line.description ?? '',
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        lineDiscountPercent: line.lineDiscountPercent,
        taxRate: line.taxRate,
        deliveryDateOverride: toDateInputValue(line.deliveryDateOverride),
      })) ?? [],
  };
}

export function hydrateSalesOrderInput(salesOrder: SalesOrderDetail): Required<SalesOrderInput> {
  return {
    customerId: salesOrder.customerId,
    orderDate: toDateInputValue(salesOrder.orderDate),
    promisedDate: toDateInputValue(salesOrder.promisedDate),
    customerReference: salesOrder.customerReference ?? '',
    salespersonName: salesOrder.salespersonName ?? '',
    salespersonEmail: salesOrder.salespersonEmail ?? '',
    paymentTerm: salesOrder.paymentTerm ?? '',
    shippingTerm: salesOrder.shippingTerm ?? '',
    shippingMethod: salesOrder.shippingMethod ?? '',
    taxMode: salesOrder.taxMode,
    documentDiscountPercent: salesOrder.documentDiscountPercent,
    notes: salesOrder.notes ?? '',
    internalNotes: salesOrder.internalNotes ?? '',
    contactName: salesOrder.contactName ?? '',
    contactEmail: salesOrder.contactEmail ?? '',
    contactPhone: salesOrder.contactPhone ?? '',
    billingAddress: salesOrder.billingAddress ?? createEmptyAddress(),
    shippingAddress: salesOrder.shippingAddress ?? createEmptyAddress(),
    lines: salesOrder.salesOrderLines.map((line) => ({
      itemId: line.itemId,
      description: line.description ?? '',
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      lineDiscountPercent: line.lineDiscountPercent,
      taxRate: line.taxRate,
      deliveryDateOverride: toDateInputValue(line.deliveryDateOverride),
    })),
  };
}

export function buildDraftQuote(customer: Customer | null): Required<QuoteInput> {
  const primaryContact = getPrimaryContact(customer);

  return {
    customerId: customer?.id ?? 0,
    quoteDate: toDateInputValue(new Date().toISOString()),
    validityDate: '',
    promisedDate: '',
    customerReference: '',
    salespersonName: '',
    salespersonEmail: '',
    paymentTerm: customer?.defaultPaymentTerm ?? PAYMENT_TERM_OPTIONS[1],
    shippingTerm: customer?.defaultShippingTerm ?? SHIPPING_TERM_OPTIONS[0],
    shippingMethod: customer?.defaultShippingMethod ?? SHIPPING_METHOD_OPTIONS[0],
    taxMode: 'exclusive',
    documentDiscountPercent: customer?.defaultDocumentDiscountPercent ?? 0,
    notes: '',
    internalNotes: '',
    contactName: primaryContact?.name ?? '',
    contactEmail: primaryContact?.email ?? '',
    contactPhone: primaryContact?.phone ?? '',
    billingAddress: customer?.billingAddress ?? createEmptyAddress(),
    shippingAddress: customer?.shippingAddress ?? createEmptyAddress(),
    lines: [],
  };
}

export function buildSalespersonOptions(users: AuthUser[]): Array<{ label: string; email: string }> {
  return users
    .filter((user) =>
      user.roles.some((r) => ['admin', 'office', 'planner'].includes(r)),
    )
    .map((user) => ({
      label: user.name,
      email: user.email,
    }));
}
