'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';

import { ManufacturedItemForm } from '../../../components/manufactured-item-form';
import { PageShell } from '../../../components/ui/page-templates';
import { Notice, Panel } from '../../../components/ui/primitives';
import { createManufacturedItem, listSuppliers } from '../../../lib/api';
import type { Supplier } from '../../../types/supplier';

export default function NewManufacturedItemPage(): JSX.Element {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setSuppliers(await listSuppliers());
      } catch {
        setError('Unable to load suppliers for the manufactured-item form.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading manufactured-item setup...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <PageShell
      eyebrow="Engineering"
      title="New manufactured item"
      description="Create the manufacturing-facing item master first, then attach BOMs, routings, and downstream production defaults from the detail workspace."
      leadingActions={
        <Button component={Link} href="/manufactured-items" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
      }
    >
      <div className="split-grid">
        <Panel
          title="Item master"
          description="The item code, type, planning defaults, and preferred vendor are captured here before engineering detail is added."
        >
          <ManufacturedItemForm
            suppliers={suppliers}
            submitLabel="Create manufactured item"
            onSubmit={async (payload) => {
              const created = await createManufacturedItem(payload);
              router.replace(`/manufactured-items/${created.id}`);
            }}
          />
        </Panel>

        <div className="page-stack">
          <Panel
            title="What happens next"
            description="The created item detail becomes the engineering workspace for BOMs, routings, and production defaults."
          >
            <Notice title="MVP-030 scope">
              This page creates the base item only. BOM rows, routing operations, and Manufacturing
              Orders are created in their dedicated production workspaces.
            </Notice>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
