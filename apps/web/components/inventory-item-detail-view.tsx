'use client';

import React from 'react';

import type {
  InventoryAdjustmentInput,
  InventoryItem,
  InventoryTransaction,
  MaterialIssueInput,
} from '../types/inventory';
import type { Item } from '../types/item';
import { InventoryAdjustmentForm } from './inventory-adjustment-form';
import { MaterialIssueForm } from './material-issue-form';
import { DataTable, EmptyState, Panel } from './ui/primitives';

type InventoryItemDetailViewProps = {
  inventoryItem: InventoryItem;
  item: Item | null;
  transactions: InventoryTransaction[];
  onIssueMaterial: (input: MaterialIssueInput) => Promise<void>;
  onAdjustInventory: (input: InventoryAdjustmentInput) => Promise<void>;
};

export function InventoryItemDetailView({
  inventoryItem,
  item,
  transactions,
  onIssueMaterial,
  onAdjustInventory,
}: InventoryItemDetailViewProps): JSX.Element {
  return (
    <div className="page-stack">
      <h1>Inventory Item #{inventoryItem.id}</h1>
      <dl>
        <dt>Tracked Item</dt>
        <dd>{item?.name ?? `Item #${inventoryItem.itemId}`}</dd>
        <dt>Item ID</dt>
        <dd>{inventoryItem.itemId}</dd>
        <dt>Quantity On Hand</dt>
        <dd>{inventoryItem.quantityOnHand}</dd>
      </dl>
      <Panel title="Manual material issue">
        <MaterialIssueForm submitLabel="Issue material" onSubmit={onIssueMaterial} />
      </Panel>
      <Panel title="Inventory adjustment">
        <InventoryAdjustmentForm submitLabel="Adjust inventory" onSubmit={onAdjustInventory} />
      </Panel>
      <Panel title="Transactions">
      {transactions.length === 0 ? (
        <EmptyState title="No transactions found" description="Inventory movements will appear here." />
      ) : (
        <DataTable
          columns={[
            { header: 'Transaction ID', cell: (transaction) => transaction.id },
            { header: 'Type', cell: (transaction) => transaction.transactionType },
            { header: 'Quantity', cell: (transaction) => transaction.quantity },
            { header: 'Notes', cell: (transaction) => transaction.notes ?? '-' },
          ]}
          rows={transactions}
          getRowKey={(transaction) => String(transaction.id)}
        />
      )}
      </Panel>
    </div>
  );
}
