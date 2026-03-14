'use client';

import React, { useState } from 'react';

import {
  formatProductionDateTime,
  normalizeProductionStatus,
  operationStatusTone,
} from '../lib/production';
import type { OperationCompletionInput, OperationDetail } from '../types/operation';
import { PageShell } from './ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  DialogFrame,
  Field,
  FormGrid,
  Notice,
  Panel,
  StatCard,
  StatGrid,
} from './ui/primitives';

type KioskOperationScreenProps = {
  operation: OperationDetail;
  onStart: () => Promise<void>;
  onPause: () => Promise<void>;
  onComplete: (input: OperationCompletionInput) => Promise<void>;
};

export function KioskOperationScreen({
  operation,
  onStart,
  onPause,
  onComplete,
}: KioskOperationScreenProps): JSX.Element {
  const [pendingAction, setPendingAction] = useState<'start' | 'pause' | 'complete' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goodQuantity, setGoodQuantity] = useState(String(operation.plannedQuantity));
  const [scrapQuantity, setScrapQuantity] = useState('0');
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: 'start' | 'pause'): Promise<void> {
    setPendingAction(action);
    setError(null);

    try {
      if (action === 'start') {
        await onStart();
      } else {
        await onPause();
      }
    } catch {
      setError(
        action === 'start'
          ? 'Unable to start the operation.'
          : 'Unable to pause the operation.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleComplete(): Promise<void> {
    if (Number(goodQuantity) < 0 || Number(scrapQuantity) < 0) {
      setError('Good and scrap quantities cannot be negative.');
      return;
    }

    setPendingAction('complete');
    setError(null);

    try {
      await onComplete({
        goodQuantity: Number(goodQuantity),
        scrapQuantity: Number(scrapQuantity),
      });
      setDialogOpen(false);
    } catch {
      setError('Unable to complete the operation.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <PageShell
      eyebrow="Kiosk"
      title={operation.operationName}
      description="Fixed, touch-friendly execution view for the operator role. It exposes only start, pause, and finish with one completion report."
      actions={
        <>
          <Badge tone={operationStatusTone(operation.status)}>
            {normalizeProductionStatus(operation.status)}
          </Badge>
          <ButtonLink href="/kiosk">Back to queue</ButtonLink>
        </>
      }
    >
      <StatGrid>
        <StatCard label="Manufacturing Order" value={operation.workOrderNumber} />
        <StatCard label="Item" value={operation.itemName} hint={operation.itemCode} />
        <StatCard label="Workstation" value={operation.workstation ?? 'Unassigned'} />
        <StatCard label="Planned Quantity" value={<span className="mono">{operation.plannedQuantity}</span>} />
      </StatGrid>

      {error ? <Notice title="Action failed" tone="warning">{error}</Notice> : null}

      <div className="split-grid">
        <Panel
          title="Execution"
          description="The kiosk keeps only the fields and actions that matter during execution."
        >
          <div className="kiosk-action-grid">
            {(operation.status === 'ready' || operation.status === 'paused') ? (
              <Button
                tone="primary"
                disabled={pendingAction !== null}
                onClick={() => {
                  void handleAction('start');
                }}
              >
                {pendingAction === 'start'
                  ? operation.status === 'paused'
                    ? 'Starting...'
                    : 'Starting...'
                  : 'Start Job'}
              </Button>
            ) : null}
            {operation.status === 'running' ? (
              <>
                <Button
                  disabled={pendingAction !== null}
                  onClick={() => {
                    void handleAction('pause');
                  }}
                >
                  {pendingAction === 'pause' ? 'Setting up...' : 'Set up'}
                </Button>
                <Button
                  disabled={pendingAction !== null}
                  onClick={() => {
                    void handleAction('pause');
                  }}
                >
                  {pendingAction === 'pause' ? 'Stopping...' : 'Stop'}
                </Button>
                <Button
                  tone="primary"
                  disabled={pendingAction !== null}
                  onClick={() => {
                    setDialogOpen(true);
                    setError(null);
                  }}
                >
                  Complete Job
                </Button>
              </>
            ) : null}
            {operation.status === 'completed' ? (
              <Notice title="Completed">
                This operation is complete. Return to the queue to pick up the next ready task.
              </Notice>
            ) : null}
          </div>
        </Panel>

        <div className="page-stack">
          <Panel
            title="Operation context"
            description="Operators can confirm the Manufacturing Order, item, workstation, and current completion results without planner-only clutter."
          >
            <DataSummary operation={operation} />
          </Panel>
        </div>
      </div>

      {dialogOpen ? (
        <div className="dialog-backdrop">
          <DialogFrame
            title="Complete Job"
            description="Enter good and scrap quantities."
            footer={
              <>
                <Button onClick={() => setDialogOpen(false)} disabled={pendingAction === 'complete'}>
                  Cancel
                </Button>
                <Button
                  tone="primary"
                  disabled={pendingAction === 'complete'}
                  onClick={() => {
                    void handleComplete();
                  }}
                >
                  {pendingAction === 'complete' ? 'Finishing...' : 'Confirm finish'}
                </Button>
              </>
            }
          >
            <FormGrid columns={2}>
              <Field label="Good Quantity">
                <input
                  className="control"
                  type="number"
                  min={0}
                  step="1"
                  value={goodQuantity}
                  onChange={(event) => setGoodQuantity(event.target.value)}
                />
              </Field>
              <Field label="Scrap Quantity">
                <input
                  className="control"
                  type="number"
                  min={0}
                  step="1"
                  value={scrapQuantity}
                  onChange={(event) => setScrapQuantity(event.target.value)}
                />
              </Field>
            </FormGrid>
          </DialogFrame>
        </div>
      ) : null}
    </PageShell>
  );
}

function DataSummary({ operation }: { operation: OperationDetail }): JSX.Element {
  return (
    <dl className="kiosk-summary">
      <div className="kiosk-summary__row">
        <dt>Manufacturing Order</dt>
        <dd>{operation.workOrderNumber}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Item</dt>
        <dd>{operation.itemName}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Workstation</dt>
        <dd>{operation.workstation ?? 'Unassigned'}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Status</dt>
        <dd>{normalizeProductionStatus(operation.status)}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Sequence</dt>
        <dd>{operation.sequence}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Assigned Operator</dt>
        <dd>{operation.assignedOperatorName ?? 'Unassigned'}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Good Quantity</dt>
        <dd>{operation.goodQuantity ?? '-'}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Scrap Quantity</dt>
        <dd>{operation.scrapQuantity ?? '-'}</dd>
      </div>
      <div className="kiosk-summary__row">
        <dt>Updated</dt>
        <dd>{formatProductionDateTime(operation.updatedAt)}</dd>
      </div>
    </dl>
  );
}
