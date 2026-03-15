'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import {
  createShipment,
  createShipmentInvoice,
  convertQuote,
  deliverShipment,
  createQuote,
  deleteQuote,
  getCurrentUser,
  getQuote,
  getSalesOrder,
  getSalesOrderAuditTrail,
  getSalesOrderShippingAvailability,
  getShipmentInvoice,
  listAuthUsers,
  listCustomers,
  listItems,
  listProductGroups,
  listSalesOrderShipments,
  listSettingsEntries,
  packShipment,
  payShipmentInvoice,
  shipShipment,
  updateQuote,
  updateQuoteStatus,
  updateSalesOrder,
  updateSalesOrderStatus,
} from '../lib/api';
import {
  buildDraftQuote,
  buildSalespersonOptions,
  calculateCommercialDocument,
  createBlankCustomerInput,
  createEditableLine,
  formatCurrency,
  formatDate,
  getPrimaryContact,
  parseWorkspaceId,
  PAYMENT_TERM_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  SHIPPING_TERM_OPTIONS,
  TAX_MODE_OPTIONS,
  TAX_RATE_OPTIONS,
  workspaceIdForDocument,
} from '../lib/commercial';
import type { AuthUser } from '../types/auth';
import type { Customer, CustomerAddress } from '../types/customer';
import type { Invoice } from '../types/invoice';
import type { Item } from '../types/item';
import type { Quote, QuoteInput, QuoteStatusTransition } from '../types/quote';
import type {
  SalesOrderAudit,
  SalesOrderDetail,
  SalesOrderInput,
  SalesOrderStatusTransition,
} from '../types/sales-order';
import type { SettingsListEntry } from '../types/settings';
import type { Shipment, ShippingAvailabilityLine } from '../types/shipment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import MuiButton from '@mui/material/Button';
import { InlineCreateCustomerDialog } from './inline-create-customer-dialog';
import { InlineCreateItemDialog } from './inline-create-item-dialog';
import { InlineCreateProductGroupDialog } from './inline-create-product-group-dialog';
import { SalesOrderProductionHandoff } from './sales-order-production-handoff';
import { ShipmentCreationPanel } from './shipment-creation-panel';
import { PageShell } from './ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Field,
  FormGrid,
  Notice,
  Panel,
  StatCard,
  StatGrid,
  Toolbar,
  ToolbarGroup,
} from './ui/primitives';

type CustomerOrderWorkspaceProps = {
  workspaceId: string;
};

type WorkspaceTab = 'header' | 'lines' | 'production' | 'shipments' | 'invoices' | 'history';

type WorkspaceFormState = {
  customerId: number;
  primaryDate: string;
  validityDate: string;
  promisedDate: string;
  customerReference: string;
  salespersonName: string;
  salespersonEmail: string;
  paymentTerm: string;
  shippingTerm: string;
  shippingMethod: string;
  taxMode: 'exclusive' | 'inclusive';
  documentDiscountPercent: number;
  notes: string;
  internalNotes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
};

const WORKSPACE_TABS: Array<{ value: WorkspaceTab; label: string }> = [
  { value: 'header', label: 'Header' },
  { value: 'lines', label: 'Lines' },
  { value: 'production', label: 'Production' },
  { value: 'shipments', label: 'Shipments' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'history', label: 'History' },
];

function createEmptyFormState(): WorkspaceFormState {
  const draft = buildDraftQuote(null);

  return {
    customerId: draft.customerId,
    primaryDate: draft.quoteDate,
    validityDate: draft.validityDate,
    promisedDate: draft.promisedDate,
    customerReference: draft.customerReference,
    salespersonName: draft.salespersonName,
    salespersonEmail: draft.salespersonEmail,
    paymentTerm: draft.paymentTerm,
    shippingTerm: draft.shippingTerm,
    shippingMethod: draft.shippingMethod,
    taxMode: draft.taxMode,
    documentDiscountPercent: draft.documentDiscountPercent,
    notes: draft.notes,
    internalNotes: draft.internalNotes,
    contactName: draft.contactName,
    contactEmail: draft.contactEmail,
    contactPhone: draft.contactPhone,
    billingAddress: draft.billingAddress,
    shippingAddress: draft.shippingAddress,
  };
}

function toWorkspaceFormFromQuote(quote: Quote): WorkspaceFormState {
  return {
    customerId: quote.customerId,
    primaryDate: quote.quoteDate.slice(0, 10),
    validityDate: quote.validityDate?.slice(0, 10) ?? '',
    promisedDate: quote.promisedDate?.slice(0, 10) ?? '',
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
    billingAddress: quote.billingAddress,
    shippingAddress: quote.shippingAddress,
  };
}

function toWorkspaceFormFromSalesOrder(salesOrder: SalesOrderDetail): WorkspaceFormState {
  return {
    customerId: salesOrder.customerId,
    primaryDate: salesOrder.orderDate.slice(0, 10),
    validityDate: '',
    promisedDate: salesOrder.promisedDate?.slice(0, 10) ?? '',
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
    billingAddress: salesOrder.billingAddress,
    shippingAddress: salesOrder.shippingAddress,
  };
}

/** UX spec: Status = Quotation, Waiting for confirmation, Confirmed (+ auto: In production, Ready for shipment) */
function getStatusDisplayLabel(status: string, kind: 'quote' | 'sales-order'): string {
  const map: Record<string, string> = {
    draft: 'Quotation',
    sent: 'Waiting for confirmation',
    approved: 'Confirmed',
    confirmed: 'Confirmed',
    released: 'Ready for shipment',
    rejected: 'Rejected',
    converted: 'Converted',
  };
  return map[status] ?? status;
}

function getQuoteActionLabel(status: string): string {
  return getStatusDisplayLabel(status, 'quote');
}

function includeStringOption(options: string[], value: string): string[] {
  const normalizedValue = value.trim();
  if (!normalizedValue || options.includes(normalizedValue)) {
    return options;
  }

  return [normalizedValue, ...options];
}

function includeNumberOption(options: number[], value: number): number[] {
  if (!Number.isFinite(value) || options.includes(value)) {
    return options;
  }

  return [value, ...options];
}

function toActiveLabelOptions(entries: SettingsListEntry[], fallback: string[]): string[] {
  const labels = entries
    .filter((entry) => entry.isActive)
    .map((entry) => entry.label.trim())
    .filter((label) => label.length > 0);
  const uniqueLabels = Array.from(new Set(labels));

  return uniqueLabels.length > 0 ? uniqueLabels : fallback;
}

function toActiveTaxRateOptions(entries: SettingsListEntry[], fallback: number[]): number[] {
  const numericRates = entries
    .filter((entry) => entry.isActive)
    .map((entry) => entry.numericValue)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const uniqueRates = Array.from(new Set(numericRates));

  return uniqueRates.length > 0 ? uniqueRates : fallback;
}

export function CustomerOrderWorkspace({
  workspaceId,
}: CustomerOrderWorkspaceProps): JSX.Element {
  const router = useRouter();
  const parsedWorkspace = useMemo(() => parseWorkspaceId(workspaceId), [workspaceId]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [productGroups, setProductGroups] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [salespeople, setSalespeople] = useState<AuthUser[]>([]);
  const [paymentTermOptions, setPaymentTermOptions] = useState<string[]>(PAYMENT_TERM_OPTIONS);
  const [shippingTermOptions, setShippingTermOptions] = useState<string[]>(SHIPPING_TERM_OPTIONS);
  const [shippingMethodOptions, setShippingMethodOptions] =
    useState<string[]>(SHIPPING_METHOD_OPTIONS);
  const [taxRateOptions, setTaxRateOptions] = useState<number[]>(TAX_RATE_OPTIONS);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [salesOrder, setSalesOrder] = useState<SalesOrderDetail | null>(null);
  const [lineRows, setLineRows] = useState<ReturnType<typeof createEditableLine>[]>([]);
  const [form, setForm] = useState<WorkspaceFormState>(() => createEmptyFormState());
  const [history, setHistory] = useState<SalesOrderAudit[]>([]);
  const [shippingAvailability, setShippingAvailability] = useState<ShippingAvailabilityLine[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [invoicesByShipmentId, setInvoicesByShipmentId] = useState<Record<number, Invoice | undefined>>({});
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('header');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [addProductLineIndex, setAddProductLineIndex] = useState<number | null>(null);
  const [addProductGroupDialogOpen, setAddProductGroupDialogOpen] = useState(false);
  const [addProductGroupLineIndex, setAddProductGroupLineIndex] = useState<number | null>(null);

  async function loadSalesOrderShippingWorkspace(salesOrderId: number): Promise<void> {
    const [availabilityData, shipmentData] = await Promise.all([
      getSalesOrderShippingAvailability(salesOrderId),
      listSalesOrderShipments(salesOrderId),
    ]);
    setShippingAvailability(availabilityData);
    setShipments(shipmentData);

    const invoiceEntries = await Promise.all(
      shipmentData.map(async (shipment) => {
        const invoice = await getShipmentInvoice(shipment.id);
        return [shipment.id, invoice ?? undefined] as const;
      }),
    );

    setInvoicesByShipmentId(Object.fromEntries(invoiceEntries));
  }

  useEffect(() => {
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const [customerData, itemData, productGroupData] = await Promise.all([
          listCustomers(),
          listItems(),
          listProductGroups(),
        ]);
        const [
          usersResult,
          currentUserResult,
          paymentTermsResult,
          shippingTermsResult,
          shippingMethodsResult,
          taxRatesResult,
        ] = await Promise.allSettled([
          listAuthUsers(),
          getCurrentUser(),
          listSettingsEntries('payment_terms'),
          listSettingsEntries('shipping_terms'),
          listSettingsEntries('shipping_methods'),
          listSettingsEntries('tax_rates'),
        ] as const);

        setCustomers(customerData);
        setItems(itemData);
        setProductGroups(productGroupData);

        const loadedUsers = usersResult.status === 'fulfilled' ? usersResult.value : [];
        const currentUser = currentUserResult.status === 'fulfilled' ? currentUserResult.value : null;
        setSalespeople(() => {
          if (!currentUser) {
            return loadedUsers;
          }

          return loadedUsers.some((user) => user.id === currentUser.id)
            ? loadedUsers
            : [...loadedUsers, currentUser];
        });

        if (paymentTermsResult.status === 'fulfilled') {
          setPaymentTermOptions(
            toActiveLabelOptions(paymentTermsResult.value, PAYMENT_TERM_OPTIONS),
          );
        }

        if (shippingTermsResult.status === 'fulfilled') {
          setShippingTermOptions(
            toActiveLabelOptions(shippingTermsResult.value, SHIPPING_TERM_OPTIONS),
          );
        }

        if (shippingMethodsResult.status === 'fulfilled') {
          setShippingMethodOptions(
            toActiveLabelOptions(shippingMethodsResult.value, SHIPPING_METHOD_OPTIONS),
          );
        }

        if (taxRatesResult.status === 'fulfilled') {
          setTaxRateOptions(toActiveTaxRateOptions(taxRatesResult.value, TAX_RATE_OPTIONS));
        }

        if (parsedWorkspace.kind === 'quote' && parsedWorkspace.id) {
          const quoteData = await getQuote(parsedWorkspace.id);
          setQuote(quoteData);
          setForm(toWorkspaceFormFromQuote(quoteData));
          setLineRows(
            (quoteData.quoteLines ?? []).map((line) => createEditableLine(itemData, line)),
          );
        } else if (parsedWorkspace.kind === 'sales-order' && parsedWorkspace.id) {
          const [salesOrderData, salesOrderAudit] = await Promise.all([
            getSalesOrder(parsedWorkspace.id),
            getSalesOrderAuditTrail(parsedWorkspace.id),
          ]);
          setSalesOrder(salesOrderData);
          setHistory(salesOrderAudit);
          await loadSalesOrderShippingWorkspace(parsedWorkspace.id);
          setForm(toWorkspaceFormFromSalesOrder(salesOrderData));
          setLineRows(
            salesOrderData.salesOrderLines.map((line) => createEditableLine(itemData, line)),
          );
        } else {
          const defaultCustomer = customerData[0] ?? null;
          setForm(createFormFromCustomer(defaultCustomer));
          setLineRows(itemData.length > 0 ? [createEditableLine(itemData)] : []);
        }
      } catch {
        setError('Unable to load the customer-order workspace.');
      } finally {
        setLoading(false);
      }
    })();
  }, [parsedWorkspace.id, parsedWorkspace.kind]);

  const currentKind = parsedWorkspace.kind === 'new' ? 'quote' : parsedWorkspace.kind;
  const currentStatus = quote?.status ?? salesOrder?.status ?? 'draft';
  const currentDocumentNumber =
    quote?.documentNumber ?? salesOrder?.documentNumber ?? '';
  const pageTitle =
    parsedWorkspace.kind === 'new'
      ? 'Create a new customer order'
      : `Customer Order ${currentDocumentNumber}`;
  const customer = customers.find((candidate) => candidate.id === form.customerId) ?? null;
  const salespersonOptions = useMemo(() => {
    const options = buildSalespersonOptions(salespeople);
    if (!form.salespersonEmail.trim()) {
      return options;
    }

    const hasCurrentSalesperson = options.some(
      (option) => option.email === form.salespersonEmail,
    );
    if (hasCurrentSalesperson) {
      return options;
    }

    return [
      {
        label: form.salespersonName.trim() || form.salespersonEmail,
        email: form.salespersonEmail,
      },
      ...options,
    ];
  }, [form.salespersonEmail, form.salespersonName, salespeople]);
  const availablePaymentTerms = useMemo(
    () => includeStringOption(paymentTermOptions, form.paymentTerm),
    [form.paymentTerm, paymentTermOptions],
  );
  const availableShippingTerms = useMemo(
    () => includeStringOption(shippingTermOptions, form.shippingTerm),
    [form.shippingTerm, shippingTermOptions],
  );
  const availableShippingMethods = useMemo(
    () => includeStringOption(shippingMethodOptions, form.shippingMethod),
    [form.shippingMethod, shippingMethodOptions],
  );
  const documentTotals = useMemo(
    () =>
      calculateCommercialDocument({
        lines: lineRows,
        taxMode: form.taxMode,
        documentDiscountPercent: form.documentDiscountPercent,
      }),
    [form.documentDiscountPercent, form.taxMode, lineRows],
  );

  function createFormFromCustomer(selectedCustomer: Customer | null): WorkspaceFormState {
    const draft = buildDraftQuote(selectedCustomer);

    return {
      customerId: draft.customerId,
      primaryDate: draft.quoteDate,
      validityDate: draft.validityDate,
      promisedDate: draft.promisedDate,
      customerReference: draft.customerReference,
      salespersonName: draft.salespersonName,
      salespersonEmail: draft.salespersonEmail,
      paymentTerm: draft.paymentTerm,
      shippingTerm: draft.shippingTerm,
      shippingMethod: draft.shippingMethod,
      taxMode: draft.taxMode,
      documentDiscountPercent: draft.documentDiscountPercent,
      notes: draft.notes,
      internalNotes: draft.internalNotes,
      contactName: draft.contactName,
      contactEmail: draft.contactEmail,
      contactPhone: draft.contactPhone,
      billingAddress: draft.billingAddress,
      shippingAddress: draft.shippingAddress,
    };
  }

  function applyCustomerSnapshots(customerId: number): void {
    const selectedCustomer = customers.find((candidate) => candidate.id === customerId) ?? null;
    const primaryContact = getPrimaryContact(selectedCustomer);

    setForm((current) => ({
      ...current,
      customerId,
      paymentTerm: selectedCustomer?.defaultPaymentTerm ?? current.paymentTerm,
      shippingTerm: selectedCustomer?.defaultShippingTerm ?? current.shippingTerm,
      shippingMethod: selectedCustomer?.defaultShippingMethod ?? current.shippingMethod,
      documentDiscountPercent:
        selectedCustomer?.defaultDocumentDiscountPercent ?? current.documentDiscountPercent,
      contactName: primaryContact?.name ?? '',
      contactEmail: primaryContact?.email ?? '',
      contactPhone: primaryContact?.phone ?? '',
      billingAddress: selectedCustomer?.billingAddress ?? current.billingAddress,
      shippingAddress: selectedCustomer?.shippingAddress ?? current.shippingAddress,
    }));
  }

  function buildQuotePayload(): QuoteInput {
    return {
      customerId: form.customerId,
      quoteDate: form.primaryDate,
      validityDate: form.validityDate || undefined,
      promisedDate: form.promisedDate || undefined,
      customerReference: form.customerReference || undefined,
      salespersonName: form.salespersonName || undefined,
      salespersonEmail: form.salespersonEmail || undefined,
      paymentTerm: form.paymentTerm || undefined,
      shippingTerm: form.shippingTerm || undefined,
      shippingMethod: form.shippingMethod || undefined,
      taxMode: form.taxMode,
      documentDiscountPercent: form.documentDiscountPercent,
      notes: form.notes || undefined,
      internalNotes: form.internalNotes || undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      billingAddress: form.billingAddress,
      shippingAddress: form.shippingAddress,
      lines: lineRows.map((line) => ({
        itemId: line.itemId,
        description: line.description || undefined,
        quantity: line.quantity,
        unit: line.unit || undefined,
        unitPrice: line.unitPrice,
        lineDiscountPercent: line.lineDiscountPercent,
        taxRate: line.taxRate,
        deliveryDateOverride: line.deliveryDateOverride || undefined,
      })),
    };
  }

  function buildSalesOrderPayload(): SalesOrderInput {
    return {
      customerId: form.customerId,
      orderDate: form.primaryDate,
      promisedDate: form.promisedDate || undefined,
      customerReference: form.customerReference || undefined,
      salespersonName: form.salespersonName || undefined,
      salespersonEmail: form.salespersonEmail || undefined,
      paymentTerm: form.paymentTerm || undefined,
      shippingTerm: form.shippingTerm || undefined,
      shippingMethod: form.shippingMethod || undefined,
      taxMode: form.taxMode,
      documentDiscountPercent: form.documentDiscountPercent,
      notes: form.notes || undefined,
      internalNotes: form.internalNotes || undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      billingAddress: form.billingAddress,
      shippingAddress: form.shippingAddress,
      lines: lineRows.map((line) => ({
        itemId: line.itemId,
        description: line.description || undefined,
        quantity: line.quantity,
        unit: line.unit || undefined,
        unitPrice: line.unitPrice,
        lineDiscountPercent: line.lineDiscountPercent,
        taxRate: line.taxRate,
        deliveryDateOverride: line.deliveryDateOverride || undefined,
      })),
    };
  }

  async function handleSave(): Promise<void> {
    if (currentKind === 'quote' && !quote && form.customerId <= 0) {
      setError('Please select or add a customer.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      if (currentKind === 'quote' && quote) {
        const updated = await updateQuote(quote.id, buildQuotePayload());
        setQuote(updated);
        setSaveMessage('Quote saved.');
      } else if (currentKind === 'quote') {
        const created = await createQuote(buildQuotePayload());
        router.replace(`/customer-orders/${workspaceIdForDocument('quote', created.id)}`);
        return;
      } else if (salesOrder) {
        const updated = await updateSalesOrder(salesOrder.id, buildSalesOrderPayload());
        setSalesOrder(updated);
        await loadSalesOrderShippingWorkspace(updated.id);
        setSaveMessage('Sales order saved.');
      }
    } catch {
      setError('Unable to save the workspace.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuoteStatus(nextStatus: QuoteStatusTransition): Promise<void> {
    if (!quote) {
      return;
    }

    try {
      const updated = await updateQuoteStatus(quote.id, { status: nextStatus });
      setQuote(updated);
      setSaveMessage(`Quote moved to ${updated.status}.`);
    } catch {
      setError('Unable to update quote status.');
    }
  }

  async function handleQuoteConversion(): Promise<void> {
    if (!quote) {
      return;
    }

    try {
      const converted = await convertQuote(quote.id);
      router.replace(
        `/customer-orders/${workspaceIdForDocument('sales-order', converted.salesOrder.id)}`,
      );
    } catch {
      setError('Unable to convert the quote.');
    }
  }

  async function handleSalesOrderStatus(nextStatus: SalesOrderStatusTransition): Promise<void> {
    if (!salesOrder) {
      return;
    }

    try {
      const updated = await updateSalesOrderStatus(salesOrder.id, { status: nextStatus });
      setSalesOrder((current) => (current ? { ...current, ...updated } : current));
      setHistory(await getSalesOrderAuditTrail(salesOrder.id));
      await loadSalesOrderShippingWorkspace(salesOrder.id);
      setSaveMessage(`Sales order moved to ${updated.status}.`);
    } catch {
      setError('Unable to update sales order status.');
    }
  }

  if (loading) {
    return <p>Loading customer-order workspace...</p>;
  }

  if (error && !quote && !salesOrder && parsedWorkspace.kind !== 'new') {
    return <p role="alert">{error}</p>;
  }

  async function handleDeleteQuote(): Promise<void> {
    if (!quote || quote.status !== 'draft') return;
    if (!globalThis.confirm?.('Delete this customer order?')) return;
    try {
      await deleteQuote(quote.id);
      router.push('/customer-orders');
    } catch {
      setError('Unable to delete the customer order.');
    }
  }

  return (
    <>
    <PageShell
      eyebrow="Customer Orders"
      title={pageTitle}
      description="Unified commercial workspace across quote and sales-order data with dense inline lines, downstream tabs, and strong action controls."
      leadingActions={
        <MuiButton component={Link} href="/customer-orders" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </MuiButton>
      }
      actions={
        <>
          <Badge tone={currentKind === 'quote' ? 'info' : 'success'}>
            {getStatusDisplayLabel(currentStatus, currentKind ?? 'quote')}
          </Badge>
          {customer ? <ButtonLink href={`/customers/${customer.id}`}>Open customer</ButtonLink> : null}
          <Button tone="primary" onClick={() => void handleSave()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {quote && quote.status === 'draft' ? (
            <>
              <Button tone="danger" onClick={() => void handleDeleteQuote()}>
                Delete
              </Button>
              <Button onClick={() => void handleQuoteStatus('sent')}>Send for confirmation</Button>
            </>
          ) : null}
          {quote && quote.status === 'sent' ? (
            <>
              <Button onClick={() => void handleQuoteStatus('approved')}>Confirm</Button>
              <Button tone="danger" onClick={() => void handleQuoteStatus('rejected')}>
                Reject Quote
              </Button>
            </>
          ) : null}
          {quote && quote.status === 'approved' ? (
            <Button onClick={() => void handleQuoteConversion()}>Convert Quote</Button>
          ) : null}
          {salesOrder && salesOrder.status === 'draft' ? (
            <Button onClick={() => void handleSalesOrderStatus('confirmed')}>
              Confirm Sales Order
            </Button>
          ) : null}
          {salesOrder && salesOrder.status === 'confirmed' ? (
            <Button onClick={() => void handleSalesOrderStatus('released')}>
              Release Sales Order
            </Button>
          ) : null}
          {salesOrder ? (
            <Button onClick={() => setActiveTab('shipments')}>Open shipments</Button>
          ) : (
            <Button disabled>Create Shipment</Button>
          )}
        </>
      }
    >
      <StatGrid>
        <StatCard label="Subtotal" value={formatCurrency(documentTotals.subtotalAmount)} />
        <StatCard label="Tax" value={formatCurrency(documentTotals.taxAmount)} />
        <StatCard label="Total" value={formatCurrency(documentTotals.totalAmount)} />
        <StatCard label="Lines" value={documentTotals.lines.length} />
      </StatGrid>
      <Panel title="Workspace" description="The customer-order workspace keeps commercial header data, lines, and downstream placeholders in one tabbed surface.">
        <Toolbar>
          <ToolbarGroup>
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`workspace-tab${activeTab === tab.value ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </ToolbarGroup>
          <ToolbarGroup>
            <span className="muted-copy">
              Quotes and sales orders stay separate business objects while sharing this user-facing workspace.
            </span>
          </ToolbarGroup>
        </Toolbar>
        {saveMessage ? <Notice title="Saved">{saveMessage}</Notice> : null}
        {error ? <p role="alert">{error}</p> : null}
        {activeTab === 'header' ? (
          <div className="split-grid">
            <Panel title="Document header" description="Snapshot fields come from the selected customer card and stay editable per document.">
              <FormGrid columns={2}>
                <Field label="Document Number">
                  <input className="control" value={currentDocumentNumber} disabled />
                </Field>
                <Field label="Document Type">
                  <input className="control" value={currentKind === 'quote' ? 'Quote' : 'Sales Order'} disabled />
                </Field>
                <Field label="Status">
                  <input className="control" value={getStatusDisplayLabel(currentStatus, currentKind ?? 'quote')} disabled />
                </Field>
                <Field label={currentKind === 'quote' ? 'Quote Date' : 'Order Date'}>
                  <input
                    className="control"
                    type="date"
                    value={form.primaryDate}
                    onChange={(event) => setForm((current) => ({ ...current, primaryDate: event.target.value }))}
                  />
                </Field>
                {currentKind === 'quote' ? (
                  <Field label="Validity Date">
                    <input
                      className="control"
                      type="date"
                      value={form.validityDate}
                      onChange={(event) => setForm((current) => ({ ...current, validityDate: event.target.value }))}
                    />
                  </Field>
                ) : null}
                <Field label="Promised Delivery Date">
                  <input
                    className="control"
                    type="date"
                    value={form.promisedDate}
                    onChange={(event) => setForm((current) => ({ ...current, promisedDate: event.target.value }))}
                  />
                </Field>
                <Field label="Customer">
                  <select
                    className="control"
                    value={form.customerId}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === '__add_new__') {
                        setAddCustomerDialogOpen(true);
                      } else {
                        applyCustomerSnapshots(Number(value));
                      }
                    }}
                  >
                    <option value="__add_new__">Add new customer</option>
                    <option value={0}>Select customer</option>
                    {customers.map((customerOption) => (
                      <option key={customerOption.id} value={customerOption.id}>
                        {customerOption.code ? `${customerOption.code} ` : ''}
                        {customerOption.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Selected Contact">
                  <input
                    className="control"
                    value={form.contactName}
                    onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
                  />
                </Field>
                <Field label="Contact Email">
                  <input
                    className="control"
                    value={form.contactEmail}
                    onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                  />
                </Field>
                <Field label="Contact Phone">
                  <input
                    className="control"
                    value={form.contactPhone}
                    onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
                  />
                </Field>
                <Field label="Customer Reference">
                  <input
                    className="control"
                    value={form.customerReference}
                    onChange={(event) => setForm((current) => ({ ...current, customerReference: event.target.value }))}
                  />
                </Field>
                <Field label="Salesperson">
                  <select
                    className="control"
                    value={form.salespersonEmail}
                    onChange={(event) => {
                      const selectedSalesperson =
                        salespersonOptions.find((option) => option.email === event.target.value) ??
                        null;
                      setForm((current) => ({
                        ...current,
                        salespersonEmail: selectedSalesperson?.email ?? '',
                        salespersonName: selectedSalesperson?.label ?? '',
                      }));
                    }}
                  >
                    <option value="">Select salesperson</option>
                    {salespersonOptions.map((option) => (
                      <option key={option.email} value={option.email}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Payment Term">
                  <select
                    className="control"
                    value={form.paymentTerm}
                    onChange={(event) => setForm((current) => ({ ...current, paymentTerm: event.target.value }))}
                  >
                    <option value="">Select payment term</option>
                    {availablePaymentTerms.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Delivery Terms">
                  <select
                    className="control"
                    value={form.shippingTerm}
                    onChange={(event) => setForm((current) => ({ ...current, shippingTerm: event.target.value }))}
                  >
                    <option value="">Select delivery terms</option>
                    {availableShippingTerms.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Shipping Method">
                  <select
                    className="control"
                    value={form.shippingMethod}
                    onChange={(event) => setForm((current) => ({ ...current, shippingMethod: event.target.value }))}
                  >
                    <option value="">Select shipping method</option>
                    {availableShippingMethods.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tax Mode">
                  <select
                    className="control"
                    value={form.taxMode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        taxMode: event.target.value as WorkspaceFormState['taxMode'],
                      }))
                    }
                  >
                    {TAX_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Document Discount %">
                  <input
                    className="control"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.documentDiscountPercent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        documentDiscountPercent: Number(event.target.value),
                      }))
                    }
                  />
                </Field>
                <Field label="Notes">
                  <textarea
                    className="control"
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Order notes"
                  />
                </Field>
              </FormGrid>
            </Panel>
            <div className="page-stack">
              <Panel
                key="shippingAddress"
                title="Shipping Address"
                description="Delivery destination. Values copied from the customer card, editable per document."
              >
                <FormGrid>
                  {(['street', 'city', 'postcode', 'stateRegion', 'country'] as const).map((field) => (
                    <Field
                      key={field}
                      label={
                        field === 'stateRegion'
                          ? 'State / Region'
                          : field.charAt(0).toUpperCase() + field.slice(1)
                      }
                    >
                      <input
                        className="control"
                        value={form.shippingAddress[field] ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            shippingAddress: {
                              ...current.shippingAddress,
                              [field]: event.target.value,
                            },
                          }))
                        }
                      />
                    </Field>
                  ))}
                </FormGrid>
              </Panel>
              {(['billingAddress'] as const).map((addressKey) => (
                <Panel
                  key={addressKey}
                  title={addressKey === 'billingAddress' ? 'Billing address' : 'Shipping address'}
                  description="Snapshot values copied from the customer card, but editable per document."
                >
                  <FormGrid>
                    {(['street', 'city', 'postcode', 'stateRegion', 'country'] as const).map((field) => (
                      <Field
                        key={field}
                        label={
                          field === 'stateRegion'
                            ? 'State / Region'
                            : field.charAt(0).toUpperCase() + field.slice(1)
                        }
                      >
                        <input
                          className="control"
                          value={form[addressKey][field] ?? ''}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [addressKey]: {
                                ...current[addressKey],
                                [field]: event.target.value,
                              },
                            }))
                          }
                        />
                      </Field>
                    ))}
                  </FormGrid>
                </Panel>
              ))}
            </div>
          </div>
        ) : null}
        {activeTab === 'lines' ? (
          <div className="page-stack">
            <Toolbar>
              <ToolbarGroup>
                <Badge tone="info">{lineRows.length} line rows</Badge>
                <span className="muted-copy">
                  Line totals recalculate immediately as quantity, price, discount, and tax change.
                </span>
              </ToolbarGroup>
              <ToolbarGroup>
                <Button
                  onClick={() =>
                    setLineRows((current) => [...current, createEditableLine(items)])
                  }
                >
                  Add line
                </Button>
              </ToolbarGroup>
            </Toolbar>
            <div className="dense-table-wrap">
              <table className="dense-table dense-table--editor">
                <thead>
                  <tr>
                    <th>Product group</th>
                    <th>Product</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Line Disc. %</th>
                    <th>Tax %</th>
                    <th>Line Date</th>
                    <th>Subtotal</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {documentTotals.lines.length > 0 ? (
                    documentTotals.lines.map((line, index) => {
                      const lineTaxRateOptions = includeNumberOption(
                        taxRateOptions,
                        line.taxRate,
                      );

                      const selectedItem = items.find((i) => i.id === line.itemId);
                      return (
                        <tr key={line.key}>
                        <td>
                          <div className="stack stack--tight">
                            <select
                              className="control control--dense"
                              value={line.itemGroup || ''}
                              onChange={(event) => {
                                const value = event.target.value;
                                if (value === '__add_new__') {
                                  setAddProductGroupLineIndex(index);
                                  setAddProductGroupDialogOpen(true);
                                } else {
                                  setLineRows((current) =>
                                    current.map((candidate, candidateIndex) =>
                                      candidateIndex === index
                                        ? { ...candidate, itemGroup: value }
                                        : candidate,
                                    ),
                                  );
                                }
                              }}
                            >
                              <option value="">Select product group</option>
                              <option value="__add_new__">Add new product group</option>
                              {Array.from(
                                new Set([
                                  ...productGroups.map((g) => g.name),
                                  ...items.map((i) => i.itemGroup).filter(Boolean) as string[],
                                  ...(line.itemGroup ? [line.itemGroup] : []),
                                ]),
                              )
                                .sort()
                                .map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td>
                          <div className="stack stack--tight">
                            <select
                              className="control control--dense"
                              value={line.itemId}
                              onChange={(event) => {
                                const value = event.target.value;
                                if (value === '__add_new__') {
                                  setAddProductLineIndex(index);
                                  setAddProductDialogOpen(true);
                                } else {
                                  const item = items.find(
                                    (candidate) => candidate.id === Number(value),
                                  );
                                  setLineRows((current) =>
                                    current.map((candidate, candidateIndex) =>
                                      candidateIndex === index
                                        ? {
                                            ...candidate,
                                            itemId: item?.id ?? 0,
                                            itemCode: item?.code ?? (item ? `ITEM-${String(item.id).padStart(4, '0')}` : ''),
                                            itemName: item?.name ?? '',
                                            itemGroup: item?.itemGroup ?? candidate.itemGroup,
                                            description: item?.description ?? item?.name ?? '',
                                            unitPrice: item?.defaultPrice ?? candidate.unitPrice,
                                          }
                                        : candidate,
                                    ),
                                  );
                                }
                              }}
                            >
                              <option value="__add_new__">Add new product</option>
                              <option value={0}>Select product</option>
                              {items
                                .filter(
                                  (item) =>
                                    !line.itemGroup ||
                                    (item.itemGroup ?? '') === line.itemGroup,
                                )
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.code ?? `ITEM-${String(item.id).padStart(4, '0')}`} {item.name}
                                  </option>
                                ))}
                            </select>
                            <span className="muted-copy--small mono">{line.itemCode}</span>
                          </div>
                        </td>
                        <td>
                          <textarea
                            className="control control--dense"
                            value={line.description}
                            onChange={(event) =>
                              setLineRows((current) =>
                                current.map((candidate, candidateIndex) =>
                                  candidateIndex === index
                                    ? { ...candidate, description: event.target.value }
                                    : candidate,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="control control--dense"
                            type="number"
                            min={1}
                            step="1"
                            value={line.quantity}
                            onChange={(event) =>
                              setLineRows((current) =>
                                current.map((candidate, candidateIndex) =>
                                  candidateIndex === index
                                    ? { ...candidate, quantity: Number(event.target.value) }
                                    : candidate,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="control control--dense"
                            value={line.unit}
                            onChange={(event) =>
                              setLineRows((current) =>
                                current.map((candidate, candidateIndex) =>
                                  candidateIndex === index
                                    ? { ...candidate, unit: event.target.value }
                                    : candidate,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="control control--dense"
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(event) =>
                              setLineRows((current) =>
                                current.map((candidate, candidateIndex) =>
                                  candidateIndex === index
                                    ? { ...candidate, unitPrice: Number(event.target.value) }
                                    : candidate,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="control control--dense"
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.lineDiscountPercent}
                            onChange={(event) =>
                              setLineRows((current) =>
                                current.map((candidate, candidateIndex) =>
                                  candidateIndex === index
                                    ? {
                                        ...candidate,
                                        lineDiscountPercent: Number(event.target.value),
                                      }
                                    : candidate,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="control control--dense"
                            value={line.taxRate}
                            onChange={(event) =>
                              setLineRows((current) =>
                                current.map((candidate, candidateIndex) =>
                                  candidateIndex === index
                                    ? { ...candidate, taxRate: Number(event.target.value) }
                                    : candidate,
                                ),
                              )
                            }
                          >
                            {lineTaxRateOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}%
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="control control--dense"
                            type="date"
                            value={line.deliveryDateOverride}
                            onChange={(event) =>
                              setLineRows((current) =>
                                current.map((candidate, candidateIndex) =>
                                  candidateIndex === index
                                    ? { ...candidate, deliveryDateOverride: event.target.value }
                                    : candidate,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="dense-table__cell--right mono">
                          {formatCurrency(line.lineTotal)}
                        </td>
                        <td className="dense-table__cell--right mono">
                          {formatCurrency(line.taxAmount)}
                        </td>
                        <td className="dense-table__cell--right mono">
                          {formatCurrency(line.totalAmount)}
                        </td>
                        <td>
                          <IconButton
                            size="small"
                            aria-label="Delete line"
                            onClick={() =>
                              setLineRows((current) =>
                                current.filter((_, lineIndex) => lineIndex !== index),
                              )
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12}>
                        <EmptyState
                          title="No lines yet"
                          description="Add at least one item row to test the dense MRPeasy-style entry table and live totals behaviour."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {activeTab === 'production' ? (
          salesOrder ? (
            <SalesOrderProductionHandoff salesOrder={salesOrder} items={items} />
          ) : (
            <Notice title="Quote stage only">
              Manufacturing Orders are created from released sales orders. Convert and release the
              quote first, then return to this tab for the production handoff.
            </Notice>
          )
        ) : null}
        {activeTab === 'shipments' ? (
          salesOrder ? (
            <ShipmentCreationPanel
              salesOrderId={salesOrder.id}
              salesOrderStatus={salesOrder.status}
              availability={shippingAvailability}
              shipments={shipments}
              invoicesByShipmentId={invoicesByShipmentId}
              onCreate={async (input) => {
                const created = await createShipment(input);
                await Promise.all([
                  loadSalesOrderShippingWorkspace(salesOrder.id),
                  getSalesOrder(salesOrder.id).then((data) => setSalesOrder(data)),
                ]);
                return created;
              }}
              onPack={async (shipmentId) => {
                const updated = await packShipment(shipmentId);
                await Promise.all([
                  loadSalesOrderShippingWorkspace(salesOrder.id),
                  getSalesOrder(salesOrder.id).then((data) => setSalesOrder(data)),
                ]);
                return updated;
              }}
              onShip={async (shipmentId) => {
                const updated = await shipShipment(shipmentId);
                await Promise.all([
                  loadSalesOrderShippingWorkspace(salesOrder.id),
                  getSalesOrder(salesOrder.id).then((data) => setSalesOrder(data)),
                ]);
                return updated;
              }}
              onDeliver={async (shipmentId) => {
                const updated = await deliverShipment(shipmentId);
                await Promise.all([
                  loadSalesOrderShippingWorkspace(salesOrder.id),
                  getSalesOrder(salesOrder.id).then((data) => setSalesOrder(data)),
                ]);
                return updated;
              }}
              onGenerateInvoice={async (shipmentId) => {
                const invoice = await createShipmentInvoice(shipmentId);
                await Promise.all([
                  loadSalesOrderShippingWorkspace(salesOrder.id),
                  getSalesOrder(salesOrder.id).then((data) => setSalesOrder(data)),
                ]);
                return invoice;
              }}
              onMarkInvoicePaid={async (shipmentId) => {
                const invoice = await payShipmentInvoice(shipmentId);
                await loadSalesOrderShippingWorkspace(salesOrder.id);
                return invoice;
              }}
            />
          ) : (
            <Notice title="Quote stage only">
              Convert the quote first, then the shipments tab will expose shipping availability,
              shipment creation, and links into the shipment workspace.
            </Notice>
          )
        ) : null}
        {activeTab === 'invoices' ? (
          salesOrder ? (
            <DataTable
              columns={[
                {
                  header: 'Invoice',
                  cell: (invoice) => (
                    <div className="stack stack--tight">
                      <Link href={`/invoices/${invoice.id}`} className="mono">
                        {invoice.number}
                      </Link>
                      <span className="muted-copy--small">{invoice.shipmentNumber}</span>
                    </div>
                  ),
                },
                { header: 'Status', width: '110px', cell: (invoice) => <Badge tone={invoice.status === 'paid' ? 'success' : 'info'}>{invoice.status}</Badge> },
                { header: 'Issue Date', width: '120px', cell: (invoice) => formatDate(invoice.issueDate) },
                { header: 'Due Date', width: '120px', cell: (invoice) => formatDate(invoice.dueDate) },
                { header: 'Paid Date', width: '120px', cell: (invoice) => formatDate(invoice.paidAt) },
              ]}
              rows={Object.values(invoicesByShipmentId).filter((invoice): invoice is Invoice => Boolean(invoice))}
              getRowKey={(invoice) => String(invoice.id)}
              emptyState={
                <EmptyState
                  title="No invoices yet"
                  description="Delivered shipments can generate invoices from the shipments tab."
                />
              }
            />
          ) : (
            <Notice title="Quote stage only">
              Invoices become available once a sales order starts moving through shipment and delivery.
            </Notice>
          )
        ) : null}
        {activeTab === 'history' ? (
          salesOrder ? (
            history.length > 0 ? (
              <DataTable
                columns={[
                  {
                    header: 'When',
                    width: '140px',
                    cell: (entry) => (
                      <span className="mono">{formatDate(entry.createdAt)}</span>
                    ),
                  },
                  {
                    header: 'Action',
                    cell: (entry) => (
                      <div className="stack stack--tight">
                        <strong>{entry.action}</strong>
                        <span className="muted-copy--small">{entry.actor}</span>
                      </div>
                    ),
                  },
                  {
                    header: 'From',
                    width: '120px',
                    cell: (entry) => entry.fromStatus ?? '-',
                  },
                  {
                    header: 'To',
                    width: '120px',
                    cell: (entry) => <Badge tone="info">{entry.toStatus}</Badge>,
                  },
                ]}
                rows={history}
                getRowKey={(entry) => String(entry.id)}
              />
            ) : (
              <EmptyState
                title="No sales-order history yet"
                description="Status transitions and conversion events will appear here as this document moves through the lifecycle."
              />
            )
          ) : (
            <Notice title="Quote history">
              Quote history in `MVP-020` is limited to the current status, creation time, and
              conversion outcome. Persistent status audit expands in later workflow slices if
              required.
            </Notice>
          )
        ) : null}
      </Panel>
    </PageShell>
    <InlineCreateCustomerDialog
      open={addCustomerDialogOpen}
      onClose={() => setAddCustomerDialogOpen(false)}
      onCreated={(created) => {
        setCustomers((prev) => [...prev, created]);
        applyCustomerSnapshots(created.id);
        setAddCustomerDialogOpen(false);
      }}
    />
    <InlineCreateItemDialog
      open={addProductDialogOpen}
      onClose={() => {
        setAddProductDialogOpen(false);
        setAddProductLineIndex(null);
      }}
      onCreated={(created) => {
        setItems((prev) => [...prev, created]);
        if (addProductLineIndex !== null) {
          setLineRows((current) =>
            current.map((candidate, candidateIndex) =>
              candidateIndex === addProductLineIndex
                ? {
                    ...candidate,
                    itemId: created.id,
                    itemCode: created.code ?? `ITEM-${String(created.id).padStart(4, '0')}`,
                    itemName: created.name,
                    itemGroup: created.itemGroup ?? candidate.itemGroup,
                    description: created.description ?? created.name,
                    unitPrice: created.defaultPrice ?? candidate.unitPrice,
                  }
                : candidate,
            ),
          );
        }
        setAddProductDialogOpen(false);
        setAddProductLineIndex(null);
      }}
    />
    <InlineCreateProductGroupDialog
      open={addProductGroupDialogOpen}
      onClose={() => {
        setAddProductGroupDialogOpen(false);
        setAddProductGroupLineIndex(null);
      }}
      onCreated={(created) => {
        setProductGroups((prev) => [...prev, created]);
        if (addProductGroupLineIndex !== null) {
          setLineRows((current) =>
            current.map((candidate, candidateIndex) =>
              candidateIndex === addProductGroupLineIndex
                ? { ...candidate, itemGroup: created.name }
                : candidate,
            ),
          );
        }
        setAddProductGroupDialogOpen(false);
        setAddProductGroupLineIndex(null);
      }}
    />
    </>
  );
}
