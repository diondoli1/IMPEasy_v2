'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button component={Link} href="/inventory/items" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
        <Typography variant="h6">Track Inventory Item</Typography>
      </Box>
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
