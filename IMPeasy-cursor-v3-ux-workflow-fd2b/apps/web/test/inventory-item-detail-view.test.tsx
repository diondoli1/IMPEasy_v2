import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { InventoryItemDetailView } from '../components/inventory-item-detail-view';
import type {
  InventoryAdjustmentInput,
  InventoryItem,
  InventoryTransaction,
  MaterialIssueInput,
} from '../types/inventory';
import type { Item } from '../types/item';

const item: Item = {
  id: 7,
  name: 'Aluminum Plate 10mm',
  description: 'Raw stock',
  isActive: true,
  defaultRoutingId: null,
  createdAt: '2026-03-10T11:00:00.000Z',
  updatedAt: '2026-03-10T11:00:00.000Z',
};

const initialInventoryItem: InventoryItem = {
  id: 3,
  itemId: 7,
  quantityOnHand: 20,
  createdAt: '2026-03-10T11:00:00.000Z',
  updatedAt: '2026-03-10T11:00:00.000Z',
};

function InventoryItemDetailHarness(): JSX.Element {
  const [inventoryItem, setInventoryItem] = useState<InventoryItem>(initialInventoryItem);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  const handleIssue = async (payload: MaterialIssueInput): Promise<void> => {
    const created: InventoryTransaction = {
      id: transactions.length + 1,
      inventoryItemId: inventoryItem.id,
      itemId: inventoryItem.itemId,
      purchaseOrderLineId: null,
      transactionType: 'issue',
      quantity: payload.quantity,
      notes: payload.notes ?? null,
      createdAt: '2026-03-10T11:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
    };

    setTransactions((current) => [...current, created]);
    setInventoryItem((current) => ({
      ...current,
      quantityOnHand: current.quantityOnHand - payload.quantity,
    }));
  };

  const handleAdjust = async (payload: InventoryAdjustmentInput): Promise<void> => {
    const created: InventoryTransaction = {
      id: transactions.length + 1,
      inventoryItemId: inventoryItem.id,
      itemId: inventoryItem.itemId,
      purchaseOrderLineId: null,
      transactionType: 'adjustment',
      quantity: payload.delta,
      notes: payload.notes ?? null,
      createdAt: '2026-03-10T11:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
    };

    setTransactions((current) => [...current, created]);
    setInventoryItem((current) => ({
      ...current,
      quantityOnHand: current.quantityOnHand + payload.delta,
    }));
  };

  return (
    <InventoryItemDetailView
      inventoryItem={inventoryItem}
      item={item}
      transactions={transactions}
      onIssueMaterial={handleIssue}
      onAdjustInventory={handleAdjust}
    />
  );
}

describe('InventoryItemDetailView', () => {
  it('renders inventory context and empty transaction state', () => {
    render(
      <InventoryItemDetailView
        inventoryItem={initialInventoryItem}
        item={item}
        transactions={[]}
        onIssueMaterial={async () => {}}
        onAdjustInventory={async () => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Inventory Item #3' })).toBeInTheDocument();
    expect(screen.getByText('Aluminum Plate 10mm')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('No transactions found.')).toBeInTheDocument();
  });

  it('updates quantity on hand and transaction list after successful adjustment', async () => {
    render(<InventoryItemDetailHarness />);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Adjustment Delta' }), {
      target: { value: '-4' },
    });
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Notes' })[1], {
      target: { value: 'Count correction' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adjust inventory' }));

    await waitFor(() => {
      expect(screen.getByText('16')).toBeInTheDocument();
    });

    expect(screen.getByText('adjustment')).toBeInTheDocument();
    expect(screen.getByText('-4')).toBeInTheDocument();
    expect(screen.getByText('Count correction')).toBeInTheDocument();
  });
});
