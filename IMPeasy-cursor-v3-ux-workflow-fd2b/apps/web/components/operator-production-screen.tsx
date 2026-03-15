'use client';

import Link from 'next/link';
import React, { useState } from 'react';

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
    <section>
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
      <section>
        <h2>Execution Actions</h2>
        {operation.status === 'ready' ? (
          <button
            type="button"
            onClick={() => void handleAction('start')}
            disabled={pendingAction !== null}
          >
            {pendingAction === 'start' ? 'Starting...' : 'Start operation'}
          </button>
        ) : null}
        {operation.status === 'running' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void handleAction('pause')}
              disabled={pendingAction !== null}
            >
              {pendingAction === 'pause' ? 'Pausing...' : 'Pause operation'}
            </button>
            <button
              type="button"
              onClick={() => void handleAction('complete')}
              disabled={pendingAction !== null}
            >
              {pendingAction === 'complete' ? 'Completing...' : 'Complete operation'}
            </button>
          </div>
        ) : null}
        {operation.status !== 'ready' && operation.status !== 'running' ? (
          <p>No execution action available for current status.</p>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
      </section>
      <section>
        <h2>Production Logs</h2>
        {operation.status === 'running' ? (
          <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
            <label>
              Quantity
              <input
                type="number"
                min={1}
                value={logQuantity}
                onChange={(event) => setLogQuantity(event.target.value)}
              />
            </label>
            <label>
              Notes
              <input
                type="text"
                value={logNotes}
                onChange={(event) => setLogNotes(event.target.value)}
                placeholder="Optional"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleCreateProductionLog()}
              disabled={isCreatingLog}
            >
              {isCreatingLog ? 'Recording...' : 'Record production'}
            </button>
            {logError ? <p role="alert">{logError}</p> : null}
            {logSuccess ? <p>{logSuccess}</p> : null}
          </div>
        ) : (
          <p>Production logs can be recorded only while operation is running.</p>
        )}
        {productionLogs.length === 0 ? (
          <p>No production logs recorded.</p>
        ) : (
          <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
            <thead>
              <tr>
                <th align="left">Log ID</th>
                <th align="left">Quantity</th>
                <th align="left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {productionLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.quantity}</td>
                  <td>{log.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
