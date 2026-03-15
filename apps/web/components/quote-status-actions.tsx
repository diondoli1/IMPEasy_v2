'use client';

import React, { useState } from 'react';

import type { QuoteStatusTransition } from '../types/quote';

type QuoteStatusActionsProps = {
  status: string;
  onTransition: (nextStatus: QuoteStatusTransition) => Promise<void>;
};

type Action = {
  label: string;
  nextStatus: QuoteStatusTransition;
};

function getActions(status: string): Action[] {
  if (status === 'draft') {
    return [{ label: 'Mark as sent', nextStatus: 'sent' }];
  }

  if (status === 'sent') {
    return [
      { label: 'Approve', nextStatus: 'approved' },
      { label: 'Reject', nextStatus: 'rejected' },
    ];
  }

  return [];
}

export function QuoteStatusActions({ status, onTransition }: QuoteStatusActionsProps): JSX.Element {
  const [loadingStatus, setLoadingStatus] = useState<QuoteStatusTransition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actions = getActions(status);

  const handleTransition = async (nextStatus: QuoteStatusTransition): Promise<void> => {
    setLoadingStatus(nextStatus);
    setError(null);

    try {
      await onTransition(nextStatus);
    } catch {
      setError('Unable to update quote status.');
    } finally {
      setLoadingStatus(null);
    }
  };

  if (actions.length === 0) {
    return <p>No status actions available.</p>;
  }

  return (
    <section>
      <h2>Status Actions</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map((action) => (
          <button
            key={action.nextStatus}
            type="button"
            onClick={() => void handleTransition(action.nextStatus)}
            disabled={loadingStatus !== null}
          >
            {loadingStatus === action.nextStatus ? 'Updating...' : action.label}
          </button>
        ))}
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
