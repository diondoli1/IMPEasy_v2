'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { InventoryItemForm } from '../../../../components/inventory-item-form';
import { PageShell } from '../../../../components/ui/page-templates';
import { ButtonLink } from '../../../../components/ui/primitives';
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
      <PageShell eyebrow="Inventory" title="New Inventory Item" description="">
        <p role="alert">{error}</p>
        <ButtonLink href="/inventory/items" tone="secondary">Back to inventory items</ButtonLink>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Inventory"
      title="Track Inventory Item"
      description="Create a new inventory item to track stock for a product."
      actions={<ButtonLink href="/inventory/items" tone="secondary">Back to inventory items</ButtonLink>}
    >
      <InventoryItemForm
        items={items.map((item) => ({ id: item.id, name: item.name }))}
        submitLabel="Create inventory item"
        onSubmit={async (payload) => {
          const created = await createInventoryItem(payload);
          router.push(`/inventory/items/${created.id}`);
        }}
      />
    </PageShell>
  );
}
