'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { Button, DataTable, EmptyState, Field, FormGrid, Notice, Panel } from './ui/primitives';
import type { OperationDetail, ProductionLog, ProductionLogInput } from '../types/operation';

type OperatorProductionScreenProps = {
  operation: OperationDetail;
  productionLogs: ProductionLog[];
  onStart: () => Promise<void>;
  onPause: () => Promise<void>;
  onComplete: () => Promise<void>;
  onCreateProductionLog: (input: ProductionLogInput) => Promise<void>;
};

export function OperatorProductionScreen({
  operation,
  productionLogs,
  onStart,
  onPause,
  onComplete,
  onCreateProductionLog,
}: OperatorProductionScreenProps): JSX.Element {
  const [pendingAction, setPendingAction] = useState<'start' | 'pause' | 'complete' | null>(null);
  const [logQuantity, setLogQuantity] = useState('1');
  const [logNotes, setLogNotes] = useState('');
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [logSuccess, setLogSuccess] = useState<string | null>(null);

  const handleAction = async (action: 'start' | 'pause' | 'complete'): Promise<void> => {
    setPendingAction(action);
    setError(null);

    try {
      if (action === 'start') {
        await onStart();
      } else if (action === 'pause') {
        await onPause();
      } else {
        await onComplete();
      }
    } catch {
      if (action === 'start') {
        setError('Unable to start operation.');
      } else if (action === 'pause') {
        setError('Unable to pause operation.');
      } else {
        setError('Unable to complete operation.');
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreateProductionLog = async (): Promise<void> => {
    if (!logQuantity || Number(logQuantity) < 1) {
      setLogError('Quantity must be greater than zero.');
      setLogSuccess(null);
      return;
    }

    setIsCreatingLog(true);
    setLogError(null);
    setLogSuccess(null);

    try {
      await onCreateProductionLog({
        quantity: Number(logQuantity),
        notes: logNotes.trim() || undefined,
      });
      setLogQuantity('1');
      setLogNotes('');
      setLogSuccess('Production log recorded.');
    } catch {
      setLogError('Unable to record production log.');
    } finally {
      setIsCreatingLog(false);
    }
  };

  return (
    <div className="page-stack">
      <h1>Operator Screen - Operation #{operation.id}</h1>
      <p>
        <Link href="/operations/queue">Back to operation queue</Link>
      </p>
      <dl>
        <dt>Operation Name</dt>
        <dd>{operation.operationName}</dd>
        <dt>Status</dt>
        <dd>{operation.status}</dd>
        <dt>Sequence</dt>
        <dd>{operation.sequence}</dd>
        <dt>Planned Quantity</dt>
        <dd>{operation.plannedQuantity}</dd>
        <dt>Work Order</dt>
        <dd>
          <Link href={`/work-orders/${operation.workOrderId}`}>#{operation.workOrderId}</Link>
        </dd>
        <dt>Sales Order</dt>
        <dd>
          <Link href={`/sales-orders/${operation.salesOrderId}`}>#{operation.salesOrderId}</Link>
        </dd>
        {operation.reworkSourceOperationId ? (
          <>
            <dt>Rework Source Operation</dt>
            <dd>
              <Link href={`/operations/${operation.reworkSourceOperationId}`}>
                #{operation.reworkSourceOperationId}
              </Link>
            </dd>
          </>
        ) : null}
      </dl>
      <Panel title="Execution actions">
        {operation.status === 'ready' ? (
          <Button
            type="button"
            onClick={() => void handleAction('start')}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'start' ? 'Starting...' : 'Start operation'}
          </Button>
        ) : null}
        {operation.status === 'running' ? (
          <div className="toolbar">
            <Button
              type="button"
              onClick={() => void handleAction('pause')}
              disabled={pendingAction !== null}
            >
              {pendingAction === 'pause' ? 'Pausing...' : 'Pause operation'}
            </Button>
            <Button
              type="button"
              onClick={() => void handleAction('complete')}
              disabled={pendingAction !== null}
            >
              {pendingAction === 'complete' ? 'Completing...' : 'Complete operation'}
            </Button>
          </div>
        ) : null}
        {operation.status !== 'ready' && operation.status !== 'running' ? (
          <span className="muted-copy">No execution action available for current status.</span>
        ) : null}
        {error ? (
          <Notice title="Execution action failed" tone="warning">
            {error}
          </Notice>
        ) : null}
      </Panel>
      <Panel title="Production logs">
        {operation.status === 'running' ? (
          <div className="page-stack">
            <FormGrid columns={2}>
              <Field label="Quantity">
                <input
                  className="control"
                  type="number"
                  min={1}
                  value={logQuantity}
                  onChange={(event) => setLogQuantity(event.target.value)}
                />
              </Field>
              <Field label="Notes">
                <input
                  className="control"
                  type="text"
                  value={logNotes}
                  onChange={(event) => setLogNotes(event.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </FormGrid>
            <Button
              type="button"
              onClick={() => void handleCreateProductionLog()}
              disabled={isCreatingLog}
            >
              {isCreatingLog ? 'Recording...' : 'Record production'}
            </Button>
            {logError ? (
              <Notice title="Unable to record production log" tone="warning">
                {logError}
              </Notice>
            ) : null}
            {logSuccess ? <Notice title="Success">{logSuccess}</Notice> : null}
          </div>
        ) : (
          <span className="muted-copy">Production logs can be recorded only while operation is running.</span>
        )}
        {productionLogs.length === 0 ? (
          <EmptyState title="No production logs recorded" description="Logs will appear after production is recorded." />
        ) : (
          <DataTable
            columns={[
              { header: 'Log ID', cell: (log) => log.id },
              { header: 'Quantity', cell: (log) => log.quantity },
              { header: 'Notes', cell: (log) => log.notes ?? '-' },
            ]}
            rows={productionLogs}
            getRowKey={(log) => String(log.id)}
          />
        )}
      </Panel>
    </div>
  );
}
