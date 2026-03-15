'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import type {
  Inspection,
  InspectionInput,
  InspectionResultInput,
  InspectionScrapInput,
} from '../types/inspection';
import type { OperationDetail } from '../types/operation';

type OperationInspectionPanelProps = {
  operation: OperationDetail;
  inspection: Inspection | null;
  producedQuantity: number;
  onCreateInspection: (input: InspectionInput) => Promise<void>;
  onRecordInspectionResult: (input: InspectionResultInput) => Promise<void>;
  onCreateReworkOperation: () => Promise<void>;
  onRecordInspectionScrap: (input: InspectionScrapInput) => Promise<void>;
};

export function OperationInspectionPanel({
  operation,
  inspection,
  producedQuantity,
  onCreateInspection,
  onRecordInspectionResult,
  onCreateReworkOperation,
  onRecordInspectionScrap,
}: OperationInspectionPanelProps): JSX.Element {
  const [notes, setNotes] = useState('');
  const [resultStatus, setResultStatus] = useState<'passed' | 'failed'>('passed');
  const [passedQuantity, setPassedQuantity] = useState('0');
  const [failedQuantity, setFailedQuantity] = useState('0');
  const [reworkQuantity, setReworkQuantity] = useState('0');
  const [resultNotes, setResultNotes] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [reworkLoading, setReworkLoading] = useState(false);
  const [scrapNotes, setScrapNotes] = useState('');
  const [scrapLoading, setScrapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setResultStatus('passed');
    setPassedQuantity(String(producedQuantity));
    setFailedQuantity('0');
    setReworkQuantity('0');
    setResultNotes(inspection?.notes ?? '');
    setScrapNotes(inspection?.scrapNotes ?? '');
  }, [inspection?.id, producedQuantity, inspection?.notes, inspection?.scrapNotes]);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setCreateLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onCreateInspection({
        notes: notes.trim() || undefined,
      });
      setNotes('');
      setSuccess('Inspection record created.');
    } catch {
      setError('Unable to create inspection record.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResultSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setResultLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onRecordInspectionResult({
        status: resultStatus,
        passedQuantity: Number(passedQuantity),
        failedQuantity: Number(failedQuantity),
        reworkQuantity: Number(reworkQuantity),
        notes: resultNotes.trim() || undefined,
      });
      setSuccess('Inspection result recorded.');
    } catch {
      setError('Unable to record inspection result.');
    } finally {
      setResultLoading(false);
    }
  };

  const handleReworkSubmit = async (): Promise<void> => {
    setReworkLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onCreateReworkOperation();
      setSuccess('Rework operation created.');
    } catch {
      setError('Unable to create rework operation.');
    } finally {
      setReworkLoading(false);
    }
  };

  const handleScrapSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setScrapLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onRecordInspectionScrap({
        notes: scrapNotes.trim() || undefined,
      });
      setSuccess('Scrap recorded.');
    } catch {
      setError('Unable to record scrap.');
    } finally {
      setScrapLoading(false);
    }
  };

  const handleResultStatusChange = (value: 'passed' | 'failed'): void => {
    setResultStatus(value);
    if (value === 'passed') {
      setPassedQuantity(String(producedQuantity));
      setFailedQuantity('0');
      setReworkQuantity('0');
    }
  };

  const canCreateReworkOperation =
    inspection !== null &&
    ['failed', 'rework_required'].includes(inspection.status) &&
    (inspection.reworkQuantity ?? 0) > 0 &&
    inspection.reworkOperationId == null;

  return (
    <section>
      <h2>Inspection Record</h2>
      <dl>
        <dt>Produced Quantity</dt>
        <dd>{producedQuantity}</dd>
      </dl>
      {inspection ? (
        <div>
          <p>Inspection record already exists for this operation.</p>
          <dl>
            <dt>Status</dt>
            <dd>{inspection.status}</dd>
            <dt>Notes</dt>
            <dd>{inspection.notes ?? '-'}</dd>
            <dt>Passed Quantity</dt>
            <dd>{inspection.passedQuantity ?? '-'}</dd>
            <dt>Failed Quantity</dt>
            <dd>{inspection.failedQuantity ?? '-'}</dd>
            <dt>Rework Quantity</dt>
            <dd>{inspection.reworkQuantity ?? '-'}</dd>
            <dt>Rework Operation</dt>
            <dd>
              {inspection.reworkOperationId ? (
                <Link href={`/operations/${inspection.reworkOperationId}`}>
                  #{inspection.reworkOperationId}
                </Link>
              ) : (
                '-'
              )}
            </dd>
            <dt>Rework Operation Status</dt>
            <dd>{inspection.reworkOperationStatus ?? '-'}</dd>
            <dt>Rework Operation Quantity</dt>
            <dd>{inspection.reworkOperationPlannedQuantity ?? '-'}</dd>
            <dt>Scrapped Quantity</dt>
            <dd>{inspection.scrappedQuantity ?? '-'}</dd>
            <dt>Scrap Notes</dt>
            <dd>{inspection.scrapNotes ?? '-'}</dd>
          </dl>
          {inspection.status === 'pending' ? (
            producedQuantity <= 0 ? (
              <p>Inspection results require recorded production quantity before QC can proceed.</p>
            ) : (
              <form
                onSubmit={handleResultSubmit}
                style={{ display: 'grid', gap: 12, marginTop: 16, maxWidth: 520 }}
              >
                <label>
                  Result Status
                  <select
                    value={resultStatus}
                    onChange={(event) =>
                      handleResultStatusChange(event.target.value as 'passed' | 'failed')
                    }
                    name="status"
                  >
                    <option value="passed">passed</option>
                    <option value="failed">failed</option>
                  </select>
                </label>
                <label>
                  Passed Quantity
                  <input
                    type="number"
                    min="0"
                    value={passedQuantity}
                    onChange={(event) => setPassedQuantity(event.target.value)}
                    name="passedQuantity"
                  />
                </label>
                <label>
                  Failed Quantity
                  <input
                    type="number"
                    min="0"
                    value={failedQuantity}
                    onChange={(event) => setFailedQuantity(event.target.value)}
                    name="failedQuantity"
                  />
                </label>
                <label>
                  Rework Quantity
                  <input
                    type="number"
                    min="0"
                    value={reworkQuantity}
                    onChange={(event) => setReworkQuantity(event.target.value)}
                    name="reworkQuantity"
                  />
                </label>
                <label>
                  Result Notes
                  <input
                    type="text"
                    value={resultNotes}
                    onChange={(event) => setResultNotes(event.target.value)}
                    name="resultNotes"
                    placeholder="Optional"
                  />
                </label>
                <button type="submit" disabled={resultLoading}>
                  {resultLoading ? 'Saving...' : 'Record inspection result'}
                </button>
              </form>
            )
          ) : null}
          {canCreateReworkOperation ? (
            <button type="button" onClick={() => void handleReworkSubmit()} disabled={reworkLoading}>
              {reworkLoading ? 'Saving...' : 'Create rework operation'}
            </button>
          ) : null}
          {['failed', 'rework_required'].includes(inspection.status) &&
          (inspection.failedQuantity ?? 0) > 0 &&
          inspection.scrappedQuantity === null ? (
            <form
              onSubmit={handleScrapSubmit}
              style={{ display: 'grid', gap: 12, marginTop: 16, maxWidth: 520 }}
            >
              <label>
                Scrap Notes
                <input
                  type="text"
                  value={scrapNotes}
                  onChange={(event) => setScrapNotes(event.target.value)}
                  name="scrapNotes"
                  placeholder="Optional"
                />
              </label>
              <button type="submit" disabled={scrapLoading}>
                {scrapLoading ? 'Saving...' : 'Record scrap'}
              </button>
            </form>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          {success ? <p>{success}</p> : null}
        </div>
      ) : operation.status !== 'completed' ? (
        <p>Inspection records can be created only for completed operations.</p>
      ) : (
        <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
          <label>
            Inspection Notes
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              name="notes"
              placeholder="Optional"
            />
          </label>
          <button type="submit" disabled={createLoading}>
            {createLoading ? 'Saving...' : 'Create inspection record'}
          </button>
          {error ? <p role="alert">{error}</p> : null}
          {success ? <p>{success}</p> : null}
        </form>
      )}
    </section>
  );
}
