import Link from 'next/link';
import React from 'react';

import { DataTable, EmptyState } from './ui/primitives';
import type { OperationQueueEntry } from '../types/operation';

type OperationQueueTableProps = {
  entries: OperationQueueEntry[];
};

export function OperationQueueTable({ entries }: OperationQueueTableProps): JSX.Element {
  if (entries.length === 0) {
    return <EmptyState title="No queued operations found" description="Operations will appear here as work orders are released." />;
  }

  return (
    <DataTable
      columns={[
        { header: 'Operation ID', cell: (entry) => <Link href={`/operations/${entry.id}`}>{entry.id}</Link> },
        { header: 'Name', cell: (entry) => entry.operationName },
        { header: 'Status', cell: (entry) => entry.status },
        { header: 'Sequence', cell: (entry) => entry.sequence },
        { header: 'Planned Qty', cell: (entry) => entry.plannedQuantity },
        { header: 'Work Order', cell: (entry) => <Link href={`/work-orders/${entry.workOrderId}`}>WO #{entry.workOrderId}</Link> },
        { header: 'Sales Order', cell: (entry) => <Link href={`/sales-orders/${entry.salesOrderId}`}>SO #{entry.salesOrderId}</Link> },
      ]}
      rows={entries}
      getRowKey={(entry) => String(entry.id)}
    />
  );
}
