'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InventoryItemForm } from '../../../../components/inventory-item-form';
import { createInventoryItem, listItems } from '../../../../lib/api';
import type { Item } from '../../../../types/item';

export default function NewInventoryItemPage(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const itemData = await listItems();
        setItems(itemData);
      } catch {
        setError('Unable to load items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading items...</p>;
  }

  if (error) {
    return (
      <section>
        <p role="alert">{error}</p>
        <p>
          <Link href="/inventory/items">Back to inventory items</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Track Inventory Item</h1>
      <p>
        <Link href="/inventory/items">Back to inventory items</Link>
      </p>
      <InventoryItemForm
        items={items.map((item) => ({ id: item.id, name: item.name }))}
        submitLabel="Create inventory item"
        onSubmit={async (payload) => {
          const created = await createInventoryItem(payload);
          router.replace(`/inventory/items/${created.id}`);
        }}
      />
    </section>
  );
}
