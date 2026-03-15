'use client';

import React, { useEffect, useState } from 'react';

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
  producedCount?: number;
  onRecordPart?: () => Promise<void>;
  onStart?: () => Promise<void>;
  onPause: () => Promise<void>;
  onComplete: (input: OperationCompletionInput) => Promise<void>;
};

export function KioskOperationScreen({
  operation,
  producedCount = 0,
  onRecordPart,
  onStart,
  onPause,
  onComplete,
}: KioskOperationScreenProps): JSX.Element {
  const [pendingAction, setPendingAction] = useState<'record' | 'start' | 'pause' | 'complete' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const expectedTotal = producedCount > 0 ? producedCount : operation.plannedQuantity;
  const [goodQuantity, setGoodQuantity] = useState(String(expectedTotal));
  const [scrapQuantity, setScrapQuantity] = useState('0');
  const [error, setError] = useState<string | null>(null);

  async function handleRecordPart(): Promise<void> {
    if (!onRecordPart) return;
    setPendingAction('record');
    setError(null);
    try {
      await onRecordPart();
    } catch {
      setError('Unable to record part.');
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAction(action: 'start' | 'pause'): Promise<void> {
    if (action === 'pause') {
      setPendingAction('pause');
      setError(null);
      try {
        await onPause();
      } catch {
        setError('Unable to stop the process.');
      } finally {
        setPendingAction(null);
      }
      return;
    }
    if (onStart) {
      setPendingAction('start');
      setError(null);
      try {
        await onStart();
      } catch {
        setError('Unable to start the operation.');
      } finally {
        setPendingAction(null);
      }
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      let display = 'Unable to complete the operation.';
      try {
        const parsed = JSON.parse(msg);
        if (typeof parsed?.message === 'string') display = parsed.message;
      } catch {
        if (msg && msg.length < 200) display = msg;
      }
      setError(display);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <PageShell
      eyebrow="Kiosk"
      title={operation.operationName}
      description="Machine view: Start records 1 part, Stop pauses the process, Complete Job submits good and scrap quantities."
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
        <StatCard label="Quantity" value={<span className="mono">{operation.plannedQuantity}</span>} />
        {operation.status === 'running' && (
          <StatCard label="Parts produced" value={<span className="mono">{producedCount}</span>} />
        )}
      </StatGrid>

      {error ? <Notice title="Action failed" tone="warning">{error}</Notice> : null}

      <div className="split-grid">
        <Panel
          title="Execution"
          description="The kiosk keeps only the fields and actions that matter during execution."
        >
          <div className="kiosk-action-grid">
            {(operation.status === 'ready' || operation.status === 'paused') && onStart ? (
              <Button
                tone="primary"
                disabled={pendingAction !== null}
                onClick={() => void handleAction('start')}
              >
                {pendingAction === 'start' ? 'Starting...' : 'Start Job'}
              </Button>
            ) : null}
            {operation.status === 'running' ? (
              <>
                {onRecordPart && (
                  <Button
                    tone="primary"
                    disabled={pendingAction !== null}
                    onClick={() => void handleRecordPart()}
                  >
                    {pendingAction === 'record' ? 'Recording...' : 'Start'}
                  </Button>
                )}
                <Button
                  disabled={pendingAction !== null}
                  onClick={() => void handleAction('pause')}
                >
                  {pendingAction === 'pause' ? 'Stopping...' : 'Stop'}
                </Button>
                <Button
                  tone="primary"
                  disabled={pendingAction !== null}
                  onClick={() => {
                    const total = producedCount > 0 ? producedCount : operation.plannedQuantity;
                    setGoodQuantity(String(total));
                    setScrapQuantity('0');
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

      <DialogFrame
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Complete Job"
          description={
            producedCount > 0
              ? `Enter good parts and scrap parts. Total must equal parts produced (${producedCount}). Good parts are registered as produced.`
              : 'Enter good parts and scrap parts. Total must equal planned quantity. Good parts are registered as produced.'
          }
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
        <dt>Planned Quantity</dt>
        <dd>{operation.plannedQuantity}</dd>
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
