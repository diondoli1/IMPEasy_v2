'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { Button, ButtonLink, DataTable, EmptyState, Notice, Panel } from './ui/primitives';
import type { Routing } from '../types/routing';

type ItemRoutingLinksProps = {
  itemId: number;
  routings: Routing[];
  defaultRoutingId: number | null;
  onSetDefault: (routingId: number) => Promise<void>;
};

export function ItemRoutingLinks({
  itemId,
  routings,
  defaultRoutingId,
  onSetDefault,
}: ItemRoutingLinksProps): JSX.Element {
  const [loadingRoutingId, setLoadingRoutingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (routings.length === 0) {
    return (
      <EmptyState
        title="No routings linked to this item"
        description="Create a routing and set one as default for this item."
        action={<ButtonLink href="/routings/new">Create routing</ButtonLink>}
      />
    );
  }

  return (
    <Panel title="Routings" description={`Item #${itemId} can have one default routing.`}>
      <DataTable
        columns={[
          { header: 'ID', cell: (routing) => routing.id },
          { header: 'Name', cell: (routing) => <Link href={`/routings/${routing.id}`}>{routing.name}</Link> },
          { header: 'Status', cell: (routing) => routing.status },
          {
            header: 'Action',
            cell: (routing) => {
              const isDefault = routing.id === defaultRoutingId;
              const isLoading = loadingRoutingId === routing.id;
              return (
                <Button
                  type="button"
                  disabled={isDefault || isLoading}
                  onClick={() => {
                    void (async () => {
                      setLoadingRoutingId(routing.id);
                      setError(null);
                      try {
                        await onSetDefault(routing.id);
                      } catch {
                        setError('Unable to set default routing.');
                      } finally {
                        setLoadingRoutingId(null);
                      }
                    })();
                  }}
                >
                  {isDefault ? 'Default' : isLoading ? 'Saving...' : 'Set default'}
                </Button>
              );
            },
          },
        ]}
        rows={routings}
        getRowKey={(routing) => String(routing.id)}
      />
      {error ? (
        <Notice title="Unable to set default routing" tone="warning">
          {error}
        </Notice>
      ) : null}
      <ButtonLink href="/routings/new">Create routing</ButtonLink>
    </Panel>
  );
}
