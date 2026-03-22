'use client';

import Link from 'next/link';
import React from 'react';
import { useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MuiButton from '@mui/material/Button';

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
import { Badge, DataTable, EmptyState, Notice, Panel, StatCard, StatGrid, Toolbar, ToolbarGroup } from './ui/primitives';

type PurchaseOrderDetailViewProps = {
  purchaseOrder: PurchaseOrderDetail;
  items: Item[];
  stockLots: StockLot[];
  onAddLine: (input: PurchaseOrderLineInput) => Promise<void>;
  onReceiveLine: (lineId: number, input: PurchaseOrderLineReceiptInput) => Promise<void>;
};

type PurchaseOrderTab = 'header' | 'lines' | 'receipts' | 'history';

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
    <div className="page-stack">
      <div className="page-shell__header">
        <div className="page-shell__leading">
          <MuiButton component={Link} href="/purchase-orders" variant="outlined" startIcon={<ArrowBackIcon />}>
            Back
          </MuiButton>
        </div>
        <div className="page-shell__title-block">
          <div className="page-shell__eyebrow">Purchasing</div>
          <h1 className="page-shell__title">{purchaseOrder.number}</h1>
          <p className="page-shell__description">
            {purchaseOrder.supplierName} with lot-based receiving, receipt history, and stock-linked
            visibility.
          </p>
        </div>
        <div className="page-shell__actions">
          <Badge tone="info">{purchaseOrder.status}</Badge>
        </div>
      </div>

      <StatGrid>
        <StatCard label="Supplier" value={purchaseOrder.supplierName} hint={purchaseOrder.supplierCode ?? 'No code'} />
        <StatCard label="Open Qty" value={purchaseOrder.openQuantity} />
        <StatCard label="Received Qty" value={purchaseOrder.receivedQuantity} />
        <StatCard label="Expected Date" value={formatDate(purchaseOrder.expectedDate)} />
      </StatGrid>

      <Panel
        title="Purchase order workspace"
        description="The MVP receiving flow lives directly on the purchase-order detail page so office users can receive lots, inspect receipts, and verify history without leaving context."
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
          <div className="split-grid">
            <Panel title="Header" description="Commercial and receiving summary for the active purchase order.">
              <DataTable
                columns={[
                  { header: 'Field', width: '180px', cell: (row) => row.label },
                  { header: 'Value', cell: (row) => row.value },
                ]}
                rows={[
                  { id: 'supplier', label: 'Supplier', value: purchaseOrder.supplierName },
                  { id: 'reference', label: 'Supplier Reference', value: purchaseOrder.supplierReference ?? '-' },
                  { id: 'order-date', label: 'Order Date', value: formatDate(purchaseOrder.orderDate) },
                  { id: 'expected-date', label: 'Expected Date', value: formatDate(purchaseOrder.expectedDate) },
                  { id: 'buyer', label: 'Buyer', value: purchaseOrder.buyer ?? '-' },
                  { id: 'currency', label: 'Currency', value: purchaseOrder.currency },
                  { id: 'payment', label: 'Payment Term', value: purchaseOrder.paymentTerm ?? '-' },
                  { id: 'notes', label: 'Notes', value: purchaseOrder.notes ?? '-' },
                ]}
                getRowKey={(row) => row.id}
              />
            </Panel>

            <Panel title="Receiving summary" description="Open and received quantities stay visible while lines and receipts are managed in their own tabs.">
              <Notice title="Current state">
                {purchaseOrder.receivedQuantity > 0
                  ? `${purchaseOrder.receivedQuantity} units received across ${purchaseOrder.receipts.length} receipt(s).`
                  : 'No stock has been received yet for this purchase order.'}
              </Notice>
            </Panel>
          </div>
        ) : null}

        {activeTab === 'lines' ? (
          <div className="page-stack">
            <Panel
              title="Add purchase order line"
              description="Select an item, quantity, and unit price, then add the line to this order."
              muted
              compactHeader
            >
              <PurchaseOrderLineForm
                items={items.map((item) => ({ id: item.id, name: item.name }))}
                submitLabel="Add purchase order line"
                onSubmit={onAddLine}
              />
            </Panel>
            <DataTable
              columns={[
                {
                  header: 'Item',
                  cell: (line) => (
                    <div className="stack stack--tight">
                      <strong>{line.itemName}</strong>
                      <span className="muted-copy--small mono">{line.itemCode ?? `Item ${line.itemId}`}</span>
                    </div>
                  ),
                },
                { header: 'Ordered', width: '90px', align: 'right', cell: (line) => line.quantity },
                { header: 'Received', width: '90px', align: 'right', cell: (line) => line.receivedQuantity },
                { header: 'Remaining', width: '90px', align: 'right', cell: (line) => line.remainingQuantity },
                { header: 'Unit Price', width: '110px', align: 'right', cell: (line) => formatCurrency(line.unitPrice) },
                { header: 'Total', width: '110px', align: 'right', cell: (line) => formatCurrency(line.lineTotal) },
                {
                  header: 'Receive',
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
  );
}
