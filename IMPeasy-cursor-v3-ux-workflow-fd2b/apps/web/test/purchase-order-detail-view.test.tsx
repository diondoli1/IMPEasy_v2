import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { PurchaseOrderDetailView } from '../components/purchase-order-detail-view';
import { formatCurrency } from '../lib/commercial';
import type { Item } from '../types/item';
import type { PurchaseOrderLineReceiptInput } from '../types/purchase-order-line';

const items: Item[] = [
  {
    id: 7,
    code: 'ITEM-0007',
    name: 'Aluminum Plate 10mm',
    description: 'Raw stock',
    isActive: true,
    itemGroup: 'Raw material',
    unitOfMeasure: 'pcs',
    itemType: 'procured',
    defaultBomId: null,
    defaultBomName: null,
    defaultRoutingId: null,
    defaultRoutingName: null,
    defaultPrice: 12.5,
    reorderPoint: 5,
    safetyStock: 2,
    preferredVendorId: null,
    preferredVendorName: null,
    notes: null,
    createdAt: '2026-03-10T11:00:00.000Z',
    updatedAt: '2026-03-10T11:00:00.000Z',
  },
];

const purchaseOrder = {
  id: 12,
  number: 'PO-0012',
  supplierId: 4,
  supplierCode: 'SUP-0004',
  supplierName: 'Nordic Metals',
  status: 'draft',
  supplierReference: 'REF-77',
  orderDate: '2026-03-10T11:00:00.000Z',
  expectedDate: '2026-03-14T11:00:00.000Z',
  buyer: 'Alex Buyer',
  currency: 'EUR',
  paymentTerm: 'Net 30',
  openQuantity: 2,
  receivedQuantity: 7,
  notes: 'Restock aluminum',
  createdAt: '2026-03-10T11:00:00.000Z',
  updatedAt: '2026-03-10T11:00:00.000Z',
  lines: [
    {
      id: 1,
      purchaseOrderId: 12,
      itemId: 7,
      itemCode: 'ITEM-0007',
      itemName: 'Aluminum Plate 10mm',
      quantity: 5,
      receivedQuantity: 3,
      remainingQuantity: 2,
      unitPrice: 12.5,
      lineTotal: 62.5,
      createdAt: '2026-03-10T11:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
    },
    {
      id: 2,
      purchaseOrderId: 12,
      itemId: 7,
      itemCode: 'ITEM-0007',
      itemName: 'Aluminum Plate 10mm',
      quantity: 4,
      receivedQuantity: 4,
      remainingQuantity: 0,
      unitPrice: 10,
      lineTotal: 40,
      createdAt: '2026-03-10T11:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
    },
  ],
  receipts: [
    {
      id: 100,
      purchaseOrderLineId: 1,
      stockLotId: 900,
      lotNumber: 'LOT-AL-001',
      quantity: 3,
      receiptDate: '2026-03-10T12:00:00.000Z',
      notes: 'First pallet',
      createdAt: '2026-03-10T12:00:00.000Z',
      updatedAt: '2026-03-10T12:00:00.000Z',
    },
  ],
  history: [
    {
      eventType: 'created',
      message: 'Purchase order created.',
      eventDate: '2026-03-10T11:00:00.000Z',
    },
  ],
};

describe('PurchaseOrderDetailView', () => {
  it('renders purchase order lines with ordered, received, and remaining quantities', () => {
    render(
      <PurchaseOrderDetailView
        purchaseOrder={purchaseOrder}
        items={items}
        stockLots={[
          {
            id: 900,
            itemId: 7,
            itemCode: 'ITEM-0007',
            itemName: 'Aluminum Plate 10mm',
            lotNumber: 'LOT-AL-001',
            sourceDocument: 'PO-0012',
            receivedOrProducedAt: '2026-03-10T12:00:00.000Z',
            quantityOnHand: 3,
            availableQuantity: 3,
            reservedQuantity: 0,
            status: 'available',
            notes: null,
          },
        ]}
        onAddLine={async () => {}}
        onReceiveLine={async () => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Purchase order PO-0012' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lines' }));

    const linesTable = screen.getByRole('table');
    const rows = within(linesTable).getAllByRole('row');
    const firstLineRow = rows[1];

    expect(firstLineRow).not.toBeNull();
    expect(within(firstLineRow).getByText('ITEM-0007')).toBeInTheDocument();
    expect(within(firstLineRow).getByText(formatCurrency(62.5))).toBeInTheDocument();
    expect(within(linesTable).getByText('Fully received.')).toBeInTheDocument();
  });

  it('submits a receipt against the selected line', async () => {
    const received: Array<{ lineId: number; payload: PurchaseOrderLineReceiptInput }> = [];

    render(
      <PurchaseOrderDetailView
        purchaseOrder={{
          ...purchaseOrder,
          openQuantity: 4,
          receivedQuantity: 1,
          lines: [
            {
              id: 1,
              purchaseOrderId: 12,
              itemId: 7,
              itemCode: 'ITEM-0007',
              itemName: 'Aluminum Plate 10mm',
              quantity: 5,
              receivedQuantity: 1,
              remainingQuantity: 4,
              unitPrice: 12.5,
              lineTotal: 62.5,
              createdAt: '2026-03-10T11:00:00.000Z',
              updatedAt: '2026-03-10T11:00:00.000Z',
            },
          ],
          receipts: [],
        }}
        items={items}
        stockLots={[]}
        onAddLine={async () => {}}
        onReceiveLine={async (lineId, payload) => {
          received.push({ lineId, payload });
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lines' }));

    const lineRow = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(lineRow).not.toBeNull();

    fireEvent.change(
      within(lineRow).getByRole('spinbutton', {
        name: 'Receipt Quantity',
      }),
      {
        target: { value: '2' },
      },
    );
    fireEvent.change(
      within(lineRow).getByRole('textbox', { name: 'Lot Number' }),
      {
        target: { value: 'LOT-AL-002' },
      },
    );
    fireEvent.change(
      within(lineRow).getByLabelText('Receipt Date'),
      {
        target: { value: '2026-03-11' },
      },
    );
    fireEvent.change(
      within(lineRow).getByRole('textbox', { name: 'Notes' }),
      {
        target: { value: 'Dock 1' },
      },
    );
    fireEvent.click(
      within(lineRow).getByRole('button', { name: 'Receive' }),
    );

    await waitFor(() => {
      expect(received).toEqual([
        {
          lineId: 1,
          payload: {
            quantity: 2,
            lotNumber: 'LOT-AL-002',
            receiptDate: '2026-03-11',
            notes: 'Dock 1',
          },
        },
      ]);
    });
  });
});
