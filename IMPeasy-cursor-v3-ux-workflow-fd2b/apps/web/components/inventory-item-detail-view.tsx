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
    <section>
      <h1>Inventory Item #{inventoryItem.id}</h1>
      <dl>
        <dt>Tracked Item</dt>
        <dd>{item?.name ?? `Item #${inventoryItem.itemId}`}</dd>
        <dt>Item ID</dt>
        <dd>{inventoryItem.itemId}</dd>
        <dt>Quantity On Hand</dt>
        <dd>{inventoryItem.quantityOnHand}</dd>
      </dl>
      <hr style={{ margin: '24px 0' }} />
      <h2>Manual Material Issue</h2>
      <MaterialIssueForm submitLabel="Issue material" onSubmit={onIssueMaterial} />
      <h2>Inventory Adjustment</h2>
      <InventoryAdjustmentForm submitLabel="Adjust inventory" onSubmit={onAdjustInventory} />
      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Transaction ID</th>
              <th align="left">Type</th>
              <th align="left">Quantity</th>
              <th align="left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.transactionType}</td>
                <td>{transaction.quantity}</td>
                <td>{transaction.notes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
