'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { getProductionPerformanceDashboard } from '../../lib/api';
import type { ProductionPerformanceDashboardResponse } from '../../types/work-order';

const SUMMARY_CARDS: Array<{
  label: string;
  key: keyof ProductionPerformanceDashboardResponse['summary'];
}> = [
  { label: 'Total Work Orders', key: 'totalWorkOrders' },
  { label: 'In Progress', key: 'inProgressWorkOrders' },
  { label: 'Completed', key: 'completedWorkOrders' },
  { label: 'Total Operations', key: 'totalOperations' },
  { label: 'Running Operations', key: 'runningOperations' },
  { label: 'Pending Inspections', key: 'pendingInspections' },
  { label: 'Planned Quantity', key: 'totalPlannedQuantity' },
  { label: 'Recorded Quantity', key: 'totalRecordedQuantity' },
  { label: 'Scrapped Quantity', key: 'totalScrappedQuantity' },
];

function formatUpdatedAt(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function ProductionPage(): JSX.Element {
  const [dashboard, setDashboard] = useState<ProductionPerformanceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getProductionPerformanceDashboard();
        setDashboard(data);
      } catch {
        setError('Unable to load production dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading production dashboard...</p>;
  }

  if (error || !dashboard) {
    return <p role="alert">{error ?? 'Unable to load production dashboard.'}</p>;
  }

  return (
    <section>
      <h1>Production Performance</h1>
      <p>
        Read-only production dashboard for work-order progress, operation execution, inspection
        outcomes, and recorded production quantities.
      </p>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          marginBottom: 24,
        }}
      >
        {SUMMARY_CARDS.map((card) => (
          <article
            key={card.key}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>{card.label}</p>
            <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>
              {dashboard.summary[card.key]}
            </strong>
          </article>
        ))}
      </div>
      {dashboard.workOrders.length === 0 ? (
        <p>No work orders found.</p>
      ) : (
        <>
          <p style={{ color: '#475569' }}>
            Operation status shows Queued / Ready / Running / Paused / Completed. Inspection status
            shows Pending / Passed / Failed / Rework Required.
          </p>
          <table
            cellPadding={8}
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
            }}
          >
            <thead style={{ background: '#e2e8f0' }}>
              <tr>
                <th align="left">Work Order</th>
                <th align="left">Customer</th>
                <th align="left">Item</th>
                <th align="left">WO Status</th>
                <th align="left">Planned Qty</th>
                <th align="left">Operations</th>
                <th align="left">Inspections</th>
                <th align="left">Recorded Qty</th>
                <th align="left">Quality Qty</th>
                <th align="left">Scrapped Qty</th>
                <th align="left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.workOrders.map((row) => (
                <tr key={row.workOrderId} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td>
                    <Link href={`/work-orders/${row.workOrderId}`}>Work order #{row.workOrderId}</Link>
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      <Link href={`/sales-orders/${row.salesOrderId}`}>
                        Sales order #{row.salesOrderId}
                      </Link>{' '}
                      | Line #{row.salesOrderLineId}
                    </div>
                  </td>
                  <td>{row.customerName}</td>
                  <td>
                    {row.itemName}
                    <div style={{ color: '#64748b', fontSize: 12 }}>Item #{row.itemId}</div>
                  </td>
                  <td>{row.workOrderStatus}</td>
                  <td>{row.plannedQuantity}</td>
                  <td>
                    Q {row.queuedOperationCount} / R {row.readyOperationCount} / Run{' '}
                    {row.runningOperationCount} / P {row.pausedOperationCount} / Done{' '}
                    {row.completedOperationCount}
                  </td>
                  <td>
                    Pending {row.pendingInspectionCount} / Passed {row.passedInspectionCount} / Failed{' '}
                    {row.failedInspectionCount} / Rework {row.reworkRequiredInspectionCount}
                  </td>
                  <td>{row.recordedProductionQuantity}</td>
                  <td>
                    Pass {row.qualityPassedQuantity} / Fail {row.qualityFailedQuantity} / Rework{' '}
                    {row.qualityReworkQuantity}
                  </td>
                  <td>{row.scrappedQuantity}</td>
                  <td>{formatUpdatedAt(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
