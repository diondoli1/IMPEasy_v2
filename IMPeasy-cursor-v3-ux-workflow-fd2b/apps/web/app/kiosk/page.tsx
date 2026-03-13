'use client';

import React, { useEffect, useState } from 'react';

import { PageShell } from '../../components/ui/page-templates';
import { Badge, ButtonLink, EmptyState, Notice, Panel, StatCard, StatGrid } from '../../components/ui/primitives';
import { getCurrentUser, listOperationQueue } from '../../lib/api';
import { normalizeProductionStatus, operationStatusTone } from '../../lib/production';
import type { AuthUser } from '../../types/auth';
import type { OperationQueueEntry } from '../../types/operation';

export default function KioskPage(): JSX.Element {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [operations, setOperations] = useState<OperationQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [user, queue] = await Promise.all([getCurrentUser(), listOperationQueue()]);
        setCurrentUser(user);
        setOperations(queue);
      } catch {
        setError('Unable to load the kiosk queue.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading kiosk queue...</p>;
  }

  if (error || !currentUser) {
    return <p role="alert">{error ?? 'Unable to load the kiosk queue.'}</p>;
  }

  const isAdmin = currentUser.roles.includes('admin');
  const visibleOperations = operations.filter((operation) => {
    if (!['ready', 'running', 'paused'].includes(operation.status)) {
      return false;
    }

    if (isAdmin) {
      return true;
    }

    return operation.assignedOperatorId === currentUser.id;
  });

  const readyCount = visibleOperations.filter((operation) => operation.status === 'ready').length;
  const runningCount = visibleOperations.filter((operation) => operation.status === 'running').length;
  const pausedCount = visibleOperations.filter((operation) => operation.status === 'paused').length;

  return (
    <PageShell
      eyebrow="Kiosk"
      title="Operator kiosk"
      description="Fixed assigned-operation queue for the operator role. The kiosk exposes only ready, running, and paused work with a direct path into the stripped-down execution screen."
      actions={isAdmin ? <ButtonLink href="/manufacturing-orders">Planner queue</ButtonLink> : undefined}
    >
      <StatGrid>
        <StatCard label="Assigned" value={visibleOperations.length} />
        <StatCard label="Ready" value={readyCount} />
        <StatCard label="Running" value={runningCount} />
        <StatCard label="Paused" value={pausedCount} />
      </StatGrid>

      <Panel
        title="Assigned queue"
        description="Operators see only work assigned to them. Admins can use this page to spot-check the kiosk flow without planner clutter."
      >
        {!isAdmin ? (
          <Notice title="Signed-in operator">
            {currentUser.name} sees only assigned ready, running, and paused operations in this queue.
          </Notice>
        ) : null}

        {visibleOperations.length === 0 ? (
          <EmptyState
            title="No assigned operations"
            description="Release a Manufacturing Order and assign an operator to see work appear here."
          />
        ) : (
          <div className="kiosk-card-grid">
            {visibleOperations.map((operation) => (
              <div key={operation.id} className="kiosk-card">
                <div className="kiosk-card__header">
                  <div className="stack stack--tight">
                    <strong>{operation.operationName}</strong>
                    <span className="muted-copy--small mono">{operation.workOrderNumber}</span>
                  </div>
                  <Badge tone={operationStatusTone(operation.status)}>
                    {normalizeProductionStatus(operation.status)}
                  </Badge>
                </div>
                <div className="kiosk-card__meta">
                  <span>{operation.itemName}</span>
                  <span>{operation.workstation ?? 'Unassigned workstation'}</span>
                  <span>Qty {operation.plannedQuantity}</span>
                </div>
                <ButtonLink href={`/kiosk/operations/${operation.id}`} tone="primary">
                  Open operation
                </ButtonLink>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
