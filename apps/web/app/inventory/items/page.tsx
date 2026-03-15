'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
    <section>
      <h1>Inventory Items</h1>
      <p>
        <Link href="/inventory/items/new">Track inventory item</Link>
      </p>
      {inventoryItems.length === 0 ? (
        <p>No inventory items found.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Item</th>
              <th align="left">Item ID</th>
              <th align="left">Quantity On Hand</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((inventoryItem) => (
              <tr key={inventoryItem.id}>
                <td>
                  <Link href={`/inventory/items/${inventoryItem.id}`}>{inventoryItem.id}</Link>
                </td>
                <td>{itemNameMap.get(inventoryItem.itemId) ?? '-'}</td>
                <td>{inventoryItem.itemId}</td>
                <td>{inventoryItem.quantityOnHand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
