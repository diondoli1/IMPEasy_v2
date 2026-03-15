'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { SupplierForm } from '../../../components/supplier-form';
import { createSupplier } from '../../../lib/api';

export default function NewSupplierPage(): JSX.Element {
  const router = useRouter();

  return (
    <section>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button component={Link} href="/suppliers" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
        <Typography variant="h6">Create Supplier</Typography>
      </Box>
      <SupplierForm
        submitLabel="Create supplier"
        onSubmit={async (payload) => {
          const supplier = await createSupplier(payload);
          router.replace(`/suppliers/${supplier.id}`);
        }}
      />
    </section>
  );
}
