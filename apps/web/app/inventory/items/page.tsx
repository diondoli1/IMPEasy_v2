'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { PageShell } from '../../../components/ui/page-templates';
import { ButtonLink, DataTable, EmptyState, Panel } from '../../../components/ui/primitives';
import { listInventoryItems, listItems } from '../../../lib/api';
import type { InventoryItem } from '../../../types/inventory';
import type { Item } from '../../../types/item';

export default function InventoryItemsPage(): JSX.Element {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [inventoryData, itemData] = await Promise.all([listInventoryItems(), listItems()]);
        setInventoryItems(inventoryData);
        setItems(itemData);
      } catch {
        setError('Unable to load inventory items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const itemNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of items) {
      map.set(item.id, item.name);
    }
    return map;
  }, [items]);

  if (loading) {
    return <p>Loading inventory items...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <PageShell
      eyebrow="Inventory"
      title="Inventory items"
      description="Track and review inventory-item records with current on-hand quantities."
      actions={<ButtonLink href="/inventory/items/new">Track inventory item</ButtonLink>}
    >
      {inventoryItems.length === 0 ? (
        <EmptyState title="No inventory items found" description="Track an inventory item to begin stock control." />
      ) : (
        <Panel title="Tracked items">
          <DataTable
            columns={[
              {
                header: 'ID',
                cell: (inventoryItem) => (
                  <Link href={`/inventory/items/${inventoryItem.id}`}>{inventoryItem.id}</Link>
                ),
              },
              { header: 'Item', cell: (inventoryItem) => itemNameMap.get(inventoryItem.itemId) ?? '-' },
              { header: 'Item ID', cell: (inventoryItem) => inventoryItem.itemId },
              { header: 'Quantity On Hand', cell: (inventoryItem) => inventoryItem.quantityOnHand },
            ]}
            rows={inventoryItems}
            getRowKey={(inventoryItem) => String(inventoryItem.id)}
          />
        </Panel>
      )}
    </PageShell>
  );
}
