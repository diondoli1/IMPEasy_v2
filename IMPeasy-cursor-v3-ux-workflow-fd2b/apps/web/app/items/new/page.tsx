'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { ItemForm } from '../../../components/item-form';
import { createItem } from '../../../lib/api';

export default function NewItemPage(): JSX.Element {
  const router = useRouter();

  return (
    <section>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button component={Link} href="/items" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
        <Typography variant="h6">Create Item</Typography>
      </Box>
      <ItemForm
        submitLabel="Create item"
        onSubmit={async (payload) => {
          const item = await createItem(payload);
          router.replace(`/items/${item.id}`);
        }}
      />
    </section>
  );
}
