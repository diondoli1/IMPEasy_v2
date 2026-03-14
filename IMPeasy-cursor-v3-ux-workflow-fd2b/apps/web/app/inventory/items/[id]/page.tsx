'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InventoryItemDetailView } from '../../../../components/inventory-item-detail-view';
import { PageShell } from '../../../../components/ui/page-templates';
import { ButtonLink } from '../../../../components/ui/primitives';
import {
  adjustInventoryItem,
  getInventoryItem,
  getItem,
  issueInventoryMaterial,
  listInventoryTransactions,
} from '../../../../lib/api';
import type { InventoryItem, InventoryTransaction } from '../../../../types/inventory';
import type { Item } from '../../../../types/item';

export default function InventoryItemDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [inventoryData, transactionData] = await Promise.all([
          getInventoryItem(id),
          listInventoryTransactions(id),
        ]);
        setInventoryItem(inventoryData);
        setTransactions(transactionData);
        const itemData = await getItem(inventoryData.itemId);
        setItem(itemData);
      } catch {
        setError('Inventory item not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading inventory item...</p>;
  }

  if (error || !inventoryItem) {
    return (
      <PageShell eyebrow="Inventory" title="Inventory Item" description="">
        <p role="alert">{error ?? 'Inventory item not found.'}</p>
        <ButtonLink href="/inventory/items" tone="secondary">Back to inventory items</ButtonLink>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Inventory"
      title={`Inventory Item #${inventoryItem.id}`}
      description={item?.name ?? `Item #${inventoryItem.itemId}`}
      actions={<ButtonLink href="/inventory/items" tone="secondary">Back to inventory items</ButtonLink>}
    >
      <InventoryItemDetailView
        inventoryItem={inventoryItem}
        item={item}
        transactions={transactions}
        onIssueMaterial={async (payload) => {
          const created = await issueInventoryMaterial(inventoryItem.id, payload);
          setTransactions((current) => [...current, created]);
          setInventoryItem((current) =>
            current
              ? {
                  ...current,
                  quantityOnHand: current.quantityOnHand - created.quantity,
                }
              : current,
          );
        }}
        onAdjustInventory={async (payload) => {
          const created = await adjustInventoryItem(inventoryItem.id, payload);
          setTransactions((current) => [...current, created]);
          setInventoryItem((current) =>
            current
              ? {
                  ...current,
                  quantityOnHand: current.quantityOnHand + created.quantity,
                }
              : current,
          );
        }}
      />
    </PageShell>
  );
}

