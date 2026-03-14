'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { RoutingForm } from '../../../components/routing-form';
import { createRouting, listManufacturedItems } from '../../../lib/api';
import type { Item } from '../../../types/item';

export default function NewRoutingPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemIdParam = searchParams.get('itemId');
  const initialItemId = itemIdParam ? parseInt(itemIdParam, 10) : undefined;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await listManufacturedItems();
        setItems(data);
      } catch {
        setError('Unable to load items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading items...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Create Routing</Typography>
        <Button component={Link} href="/routings" variant="outlined">
          Back
        </Button>
      </Box>
      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <RoutingForm
          items={items.map((item) => ({ id: item.id, name: item.name }))}
          submitLabel="Create routing"
          initialItemId={Number.isFinite(initialItemId) ? initialItemId : undefined}
          onSubmit={async (payload) => {
            const routing = await createRouting(payload);
            router.replace(`/routings/${routing.id}`);
          }}
        />
      </Paper>
    </Box>
  );
}
