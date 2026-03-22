'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MuiButton from '@mui/material/Button';

import { SupplierForm } from '../../../components/supplier-form';
import { PageShell } from '../../../components/ui/page-templates';
import { Panel } from '../../../components/ui/primitives';
import { createSupplier } from '../../../lib/api';

export default function NewSupplierPage(): JSX.Element {
  const router = useRouter();

  return (
    <PageShell
      eyebrow="Procurement"
      title="Create supplier"
      description="Add a vendor record with contact details and default payment terms."
      leadingActions={
        <MuiButton component={Link} href="/suppliers" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </MuiButton>
      }
    >
      <Panel title="Supplier details" muted compactHeader>
        <SupplierForm
          submitLabel="Create supplier"
          onSubmit={async (payload) => {
            const supplier = await createSupplier(payload);
            router.replace(`/suppliers/${supplier.id}`);
          }}
        />
      </Panel>
    </PageShell>
  );
}
