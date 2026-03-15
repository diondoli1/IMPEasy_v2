import Link from 'next/link';
import React from 'react';

import type { OperationQueueEntry } from '../types/operation';

type OperationQueueTableProps = {
  entries: OperationQueueEntry[];
};

export function OperationQueueTable({ entries }: OperationQueueTableProps): JSX.Element {
  if (entries.length === 0) {
    return <p>No queued operations found.</p>;
  }

  return (
    <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th align="left">Operation ID</th>
          <th align="left">Name</th>
          <th align="left">Status</th>
          <th align="left">Sequence</th>
          <th align="left">Planned Qty</th>
          <th align="left">Work Order</th>
          <th align="left">Sales Order</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>
              <Link href={`/operations/${entry.id}`}>{entry.id}</Link>
            </td>
            <td>{entry.operationName}</td>
            <td>{entry.status}</td>
            <td>{entry.sequence}</td>
            <td>{entry.plannedQuantity}</td>
            <td>
              <Link href={`/work-orders/${entry.workOrderId}`}>WO #{entry.workOrderId}</Link>
            </td>
            <td>
              <Link href={`/sales-orders/${entry.salesOrderId}`}>SO #{entry.salesOrderId}</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
