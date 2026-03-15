'use client';

import Link from 'next/link';
import React, { useState } from 'react';

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
    <section>
      <h2>Work Orders</h2>
      {status === 'released' ? (
        <button type="button" disabled={loading} onClick={() => void handleGenerate()}>
          {loading ? 'Generating...' : 'Generate work orders'}
        </button>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
      {workOrders.length === 0 ? (
        <p>No work orders generated.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Sales Order Line ID</th>
              <th align="left">Routing ID</th>
              <th align="left">Quantity</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((workOrder) => (
              <tr key={workOrder.id}>
                <td>
                  <Link href={`/work-orders/${workOrder.id}`}>{workOrder.id}</Link>
                </td>
                <td>{workOrder.salesOrderLineId}</td>
                <td>{workOrder.routingId}</td>
                <td>{workOrder.quantity}</td>
                <td>{workOrder.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
