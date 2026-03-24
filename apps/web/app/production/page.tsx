'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { PageShell } from '../../components/ui/page-templates';
import { DataTable, EmptyState, Notice, Panel, StatCard, StatGrid } from '../../components/ui/primitives';
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
    <PageShell
      eyebrow="Production"
      title="Production performance"
      description="Read-only production dashboard for work-order progress, operation execution, inspection outcomes, and recorded production quantities."
    >
      <StatGrid>
        {SUMMARY_CARDS.map((card) => (
          <StatCard key={card.key} label={card.label} value={dashboard.summary[card.key]} />
        ))}
      </StatGrid>
      {dashboard.workOrders.length === 0 ? (
        <EmptyState title="No work orders found" description="Production rows will appear as work orders are created." />
      ) : (
        <Panel title="Work orders">
          <Notice title="Operation status">
            Operation status shows Queued / Ready / Running / Paused / Completed. Inspection status
            shows Pending / Passed / Failed / Rework Required.
          </Notice>
          <DataTable
            columns={[
              {
                header: 'Work Order',
                cell: (row) => (
                  <div className="stack stack--tight">
                    <Link href={`/work-orders/${row.workOrderId}`}>Work order #{row.workOrderId}</Link>
                    <span className="muted-copy--small">
                      <Link href={`/sales-orders/${row.salesOrderId}`}>Sales order #{row.salesOrderId}</Link> | Line #{row.salesOrderLineId}
                    </span>
                  </div>
                ),
              },
              { header: 'Customer', cell: (row) => row.customerName },
              {
                header: 'Item',
                cell: (row) => (
                  <div className="stack stack--tight">
                    <span>{row.itemName}</span>
                    <span className="muted-copy--small">Item #{row.itemId}</span>
                  </div>
                ),
              },
              { header: 'WO Status', cell: (row) => row.workOrderStatus },
              { header: 'Planned Qty', cell: (row) => row.plannedQuantity },
              {
                header: 'Operations',
                cell: (row) =>
                  `Q ${row.queuedOperationCount} / R ${row.readyOperationCount} / Run ${row.runningOperationCount} / P ${row.pausedOperationCount} / Done ${row.completedOperationCount}`,
              },
              {
                header: 'Inspections',
                cell: (row) =>
                  `Pending ${row.pendingInspectionCount} / Passed ${row.passedInspectionCount} / Failed ${row.failedInspectionCount} / Rework ${row.reworkRequiredInspectionCount}`,
              },
              { header: 'Recorded Qty', cell: (row) => row.recordedProductionQuantity },
              {
                header: 'Quality Qty',
                cell: (row) =>
                  `Pass ${row.qualityPassedQuantity} / Fail ${row.qualityFailedQuantity} / Rework ${row.qualityReworkQuantity}`,
              },
              { header: 'Scrapped Qty', cell: (row) => row.scrappedQuantity },
              { header: 'Updated', cell: (row) => formatUpdatedAt(row.updatedAt) },
            ]}
            rows={dashboard.workOrders}
            getRowKey={(row) => String(row.workOrderId)}
          />
        </Panel>
      )}
    </PageShell>
  );
}
