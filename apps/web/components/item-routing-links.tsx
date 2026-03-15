'use client';

import Link from 'next/link';
import React, { useState } from 'react';

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
      <div>
        <p>No routings linked to this item.</p>
        <p>
          <Link href="/routings/new">Create routing</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th align="left">ID</th>
            <th align="left">Name</th>
            <th align="left">Status</th>
            <th align="left">Action</th>
          </tr>
        </thead>
        <tbody>
          {routings.map((routing) => {
            const isDefault = routing.id === defaultRoutingId;
            const isLoading = loadingRoutingId === routing.id;

            return (
              <tr key={routing.id}>
                <td>{routing.id}</td>
                <td>
                  <Link href={`/routings/${routing.id}`}>{routing.name}</Link>
                </td>
                <td>{routing.status}</td>
                <td>
                  <button
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
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error ? <p role="alert">{error}</p> : null}
      <p>
        <Link href="/routings/new">Create routing</Link>
      </p>
      <p>Item #{itemId} can have one default routing.</p>
    </div>
  );
}
