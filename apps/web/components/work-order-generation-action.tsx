'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { Button, DataTable, EmptyState, Notice, Panel } from './ui/primitives';
import type { WorkOrder } from '../types/work-order';

type WorkOrderGenerationActionProps = {
  status: string;
  workOrders: WorkOrder[];
  onGenerate: () => Promise<WorkOrder[]>;
};

export function WorkOrderGenerationAction({
  status,
  workOrders,
  onGenerate,
}: WorkOrderGenerationActionProps): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (status !== 'released' && workOrders.length === 0) {
    return null;
  }

  const handleGenerate = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const generated = await onGenerate();
      setSuccess(`Work orders ready: ${generated.length}.`);
    } catch {
      setError('Unable to generate work orders.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Work orders">
      {status === 'released' ? (
        <Button type="button" tone="primary" disabled={loading} onClick={() => void handleGenerate()}>
          {loading ? 'Generating...' : 'Generate work orders'}
        </Button>
      ) : null}
      {error ? (
        <Notice title="Unable to generate work orders" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
      {workOrders.length === 0 ? (
        <EmptyState title="No work orders generated" description="Generate work orders once the sales order is released." />
      ) : (
        <DataTable
          columns={[
            { header: 'ID', cell: (workOrder) => <Link href={`/work-orders/${workOrder.id}`}>{workOrder.id}</Link> },
            { header: 'Sales Order Line ID', cell: (workOrder) => workOrder.salesOrderLineId },
            { header: 'Routing ID', cell: (workOrder) => workOrder.routingId },
            { header: 'Quantity', cell: (workOrder) => workOrder.quantity },
            { header: 'Status', cell: (workOrder) => workOrder.status },
          ]}
          rows={workOrders}
          getRowKey={(workOrder) => String(workOrder.id)}
        />
      )}
    </Panel>
  );
}
