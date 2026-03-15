'use client';

import React, { useState } from 'react';

import type { SalesOrderStatusTransition } from '../types/sales-order';

type SalesOrderStatusActionsProps = {
  status: string;
  onTransition: (nextStatus: SalesOrderStatusTransition) => Promise<void>;
};

type Action = {
  label: string;
  nextStatus: SalesOrderStatusTransition;
};

function getAction(status: string): Action | null {
  if (status === 'draft') {
    return { label: 'Confirm order', nextStatus: 'confirmed' };
  }

  if (status === 'confirmed') {
    return { label: 'Release order', nextStatus: 'released' };
  }

  if (status === 'released') {
    return { label: 'Mark in production', nextStatus: 'in_production' };
  }

  if (status === 'in_production') {
    return { label: 'Mark shipped', nextStatus: 'shipped' };
  }

  if (status === 'shipped') {
    return { label: 'Mark invoiced', nextStatus: 'invoiced' };
  }

  if (status === 'invoiced') {
    return { label: 'Close order', nextStatus: 'closed' };
  }

  return null;
}

export function SalesOrderStatusActions({
  status,
  onTransition,
}: SalesOrderStatusActionsProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = getAction(status);

  const handleTransition = async (): Promise<void> => {
    if (!action) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onTransition(action.nextStatus);
    } catch {
      setError('Unable to update sales order status.');
    } finally {
      setLoading(false);
    }
  };

  if (!action) {
    return <p>No status actions available.</p>;
  }

  return (
    <section>
      <h2>Status Actions</h2>
      <button type="button" onClick={() => void handleTransition()} disabled={loading}>
        {loading ? 'Updating...' : action.label}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
