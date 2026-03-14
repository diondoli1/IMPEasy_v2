'use client';

import Link from 'next/link';
import React from 'react';
import { useState } from 'react';

import { formatCurrency, formatDate } from '../lib/commercial';
import type { Item } from '../types/item';
import type { StockLot } from '../types/inventory';
import type {
  PurchaseOrderLine,
  PurchaseOrderLineInput,
  PurchaseOrderLineReceiptInput,
} from '../types/purchase-order-line';
import type { PurchaseOrderDetail } from '../types/purchase-order';
import { PurchaseOrderLineForm } from './purchase-order-line-form';
import { PurchaseOrderReceiptForm } from './purchase-order-receipt-form';
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
  Toolbar,
  ToolbarGroup,
} from './ui/primitives';

type PurchaseOrderDetailViewProps = {
  purchaseOrder: PurchaseOrderDetail;
  items: Item[];
  stockLots: StockLot[];
  onAddLine: (input: PurchaseOrderLineInput) => Promise<void>;
  onReceiveLine: (lineId: number, input: PurchaseOrderLineReceiptInput) => Promise<void>;
};

type PurchaseOrderTab = 'header' | 'lines' | 'receipts' | 'history';

function getItemGroup(items: Item[], itemId: number): string {
  const item = items.find((i) => i.id === itemId);
  return item?.itemGroup ?? '-';
}

export function PurchaseOrderDetailView({
  purchaseOrder,
  items,
  stockLots,
  onAddLine,
  onReceiveLine,
}: PurchaseOrderDetailViewProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<PurchaseOrderTab>('header');
  const purchaseOrderLines: PurchaseOrderLine[] = purchaseOrder.lines;

  return (
    <div className="po-detail po-detail--mrp">
      <header className="po-detail__header">
        <div className="po-detail__title-block">
          <h1 className="po-detail__title">Purchase order {purchaseOrder.number}</h1>
        </div>
        <div className="po-detail__actions">
          <ButtonLink href="/purchase-orders" tone="secondary">
            Back
          </ButtonLink>
          <Badge tone="success">Saved</Badge>
          <Button tone="secondary">Delete</Button>
          <Button tone="secondary">Copy</Button>
        </div>
      </header>

      <div className="po-detail__utility-bar">
        <Toolbar>
          <ToolbarGroup>
            <Button tone="utility">Send PO</Button>
            <Button tone="utility">Internal PDF</Button>
            <Button tone="utility">PDF for vendor</Button>
            <Button tone="utility">Send note</Button>
            <Button tone="utility">Delivery note</Button>
            <Button tone="utility">Send RFQ</Button>
            <Button tone="utility">RFQ</Button>
            <Button tone="utility">CSV</Button>
            <Button tone="utility">Book items</Button>
          </ToolbarGroup>
        </Toolbar>
      </div>

      <div className="po-detail__form-section">
        <div className="po-detail__form-grid">
          <div className="po-detail__form-column po-detail__form-column--left">
            <FormGrid>
              <Field label="Number" required>
                <input
                  className="control"
                  type="text"
                  value={purchaseOrder.number}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Vendor" required>
                <input
                  className="control"
                  type="text"
                  value={purchaseOrder.supplierName}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Status">
                <input
                  className="control"
                  type="text"
                  value={purchaseOrder.status}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Free text">
                <textarea
                  className="control"
                  value={purchaseOrder.notes ?? ''}
                  readOnly
                  disabled
                  rows={3}
                />
              </Field>
              <Field label="Files">
                <div className="po-detail__files-placeholder muted-copy">No files attached</div>
              </Field>
            </FormGrid>
          </div>
          <div className="po-detail__form-column po-detail__form-column--right">
            <FormGrid>
              <Field label="Created">
                <input
                  className="control"
                  type="text"
                  value={formatDate(purchaseOrder.createdAt)}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Created by">
                <input
                  className="control"
                  type="text"
                  value={purchaseOrder.buyer ?? '-'}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Expected date" required>
                <input
                  className="control"
                  type="text"
                  value={formatDate(purchaseOrder.expectedDate)}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Order ID">
                <input
                  className="control"
                  type="text"
                  value={String(purchaseOrder.id)}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Order date">
                <input
                  className="control"
                  type="text"
                  value={formatDate(purchaseOrder.orderDate)}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Invoice ID">
                <input className="control" type="text" value="-" readOnly disabled />
              </Field>
              <Field label="Invoice date">
                <input className="control" type="text" value="-" readOnly disabled />
              </Field>
              <Field label="Due date">
                <input className="control" type="text" value="-" readOnly disabled />
              </Field>
              <Field label="Shipped on">
                <input className="control" type="text" value="-" readOnly disabled />
              </Field>
              <Field label="Arrival date">
                <input
                  className="control"
                  type="text"
                  value={formatDate(purchaseOrder.expectedDate)}
                  readOnly
                  disabled
                />
              </Field>
            </FormGrid>
          </div>
        </div>
      </div>

      <div className="po-detail__workspace">
        <Panel
          title="Purchase order workspace"
          description="Header, lines, receipts, and history in one tabbed surface."
          compactHeader
        >
          <Toolbar>
            <ToolbarGroup>
              {([
                ['header', 'Header'],
                ['lines', 'Lines'],
                ['receipts', 'Receipts'],
                ['history', 'History'],
              ] as Array<[PurchaseOrderTab, string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`workspace-tab${activeTab === value ? ' workspace-tab--active' : ''}`}
                  onClick={() => setActiveTab(value)}
                >
                  {label}
                </button>
              ))}
            </ToolbarGroup>
          </Toolbar>

          {activeTab === 'header' ? (
            <div className="po-detail__header-tab">
              <Notice title="Commercial summary">
                Supplier: {purchaseOrder.supplierName}
                {purchaseOrder.supplierReference ? ` (Ref: ${purchaseOrder.supplierReference})` : ''}
                . Open qty: {purchaseOrder.openQuantity}, Received: {purchaseOrder.receivedQuantity}
                . Expected: {formatDate(purchaseOrder.expectedDate)}.
              </Notice>
            </div>
          ) : null}

          {activeTab === 'lines' ? (
            <div className="page-stack">
              <PurchaseOrderLineForm
                items={items.map((item) => ({ id: item.id, name: item.name }))}
                submitLabel="Add line"
                onSubmit={onAddLine}
              />
              <DataTable
                columns={[
                  {
                    header: 'Product group',
                    width: '120px',
                    cell: (line) => getItemGroup(items, line.itemId),
                  },
                  {
                    header: 'Item',
                    width: '180px',
                    cell: (line) => (
                      <div className="stack stack--tight">
                        <strong>{line.itemName}</strong>
                        <span className="muted-copy--small mono">{line.itemCode ?? `Item ${line.itemId}`}</span>
                      </div>
                    ),
                  },
                  {
                    header: 'Vendor part no.',
                    width: '120px',
                    cell: () => '-',
                  },
                  {
                    header: 'Ordered quantity',
                    width: '110px',
                    align: 'right',
                    cell: (line) => line.quantity,
                  },
                  {
                    header: 'Price',
                    width: '100px',
                    align: 'right',
                    cell: (line) => formatCurrency(line.unitPrice),
                  },
                  {
                    header: 'Subtotal',
                    width: '110px',
                    align: 'right',
                    cell: (line) => formatCurrency(line.lineTotal),
                  },
                  {
                    header: 'Target lot',
                    width: '100px',
                    cell: () => '-',
                  },
                  {
                    header: 'Expected quantity',
                    width: '120px',
                    align: 'right',
                    cell: (line) => line.remainingQuantity,
                  },
                  {
                    header: 'Expected date',
                    width: '120px',
                    cell: () => '-',
                  },
                  {
                    header: 'Arrival date',
                    width: '120px',
                    cell: () => '-',
                  },
                  {
                    header: 'Receive',
                    width: '200px',
                    cell: (line) => (
                      <PurchaseOrderReceiptForm
                        maxQuantity={line.remainingQuantity}
                        existingLots={stockLots
                          .filter((lot) => lot.itemId === line.itemId)
                          .map((lot) => ({ id: lot.id, lotNumber: lot.lotNumber }))}
                        submitLabel="Receive"
                        onSubmit={async (payload) => onReceiveLine(line.id, payload)}
                      />
                    ),
                  },
                ]}
                rows={purchaseOrderLines}
                getRowKey={(line) => String(line.id)}
                renderRowActions={(line) => (
                  <div className="po-detail__row-actions">
                    <Button tone="ghost" type="button">
                      Edit
                    </Button>
                    <Button tone="ghost" type="button">
                      Delete
                    </Button>
                  </div>
                )}
                emptyState={
                  <EmptyState
                    title="No lines yet"
                    description="Add the first item line, then receive it into a lot from this same workspace."
                  />
                }
              />
            </div>
          ) : null}

          {activeTab === 'receipts' ? (
            <DataTable
              columns={[
                { header: 'Date', width: '130px', cell: (receipt) => formatDate(receipt.receiptDate) },
                { header: 'Lot', width: '140px', cell: (receipt) => receipt.lotNumber ?? '-' },
                { header: 'PO Line', width: '90px', align: 'right', cell: (receipt) => receipt.purchaseOrderLineId },
                { header: 'Qty', width: '80px', align: 'right', cell: (receipt) => receipt.quantity },
                { header: 'Notes', cell: (receipt) => receipt.notes ?? '-' },
              ]}
              rows={purchaseOrder.receipts}
              getRowKey={(receipt) => String(receipt.id)}
              emptyState={
                <EmptyState
                  title="No receipts yet"
                  description="Receive stock from the Lines tab to build the lot ledger and receipt history."
                />
              }
            />
          ) : null}

          {activeTab === 'history' ? (
            <DataTable
              columns={[
                { header: 'When', width: '140px', cell: (entry) => formatDate(entry.eventDate) },
                { header: 'Event', width: '120px', cell: (entry) => entry.eventType },
                { header: 'Message', cell: (entry) => entry.message },
              ]}
              rows={purchaseOrder.history}
              getRowKey={(entry) => `${entry.eventType}-${entry.eventDate}`}
              emptyState={
                <EmptyState
                  title="No history yet"
                  description="Creation and receipt events will appear here as the order progresses."
                />
              }
            />
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
