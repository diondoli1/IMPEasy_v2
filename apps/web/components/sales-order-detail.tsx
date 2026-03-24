import Link from 'next/link';
import React from 'react';

import { DataTable, EmptyState, Panel } from './ui/primitives';
import type { SalesOrderDetail } from '../types/sales-order';

type SalesOrderDetailProps = {
  salesOrder: SalesOrderDetail;
};

export function SalesOrderDetailView({ salesOrder }: SalesOrderDetailProps): JSX.Element {
  return (
    <div className="page-stack">
      <h1>Sales Order #{salesOrder.id}</h1>
      <p>
        <Link href={`/quotes/${salesOrder.quoteId}`}>Back to quote #{salesOrder.quoteId}</Link>
      </p>
      <dl>
        <dt>Quote ID</dt>
        <dd>{salesOrder.quoteId}</dd>
        <dt>Customer ID</dt>
        <dd>{salesOrder.customerId}</dd>
        <dt>Status</dt>
        <dd>{salesOrder.status}</dd>
      </dl>
      <Panel title="Sales order lines">
      {salesOrder.salesOrderLines.length === 0 ? (
        <EmptyState title="No sales order lines found" description="Lines appear here once added to the sales order." />
      ) : (
        <DataTable
          columns={[
            { header: 'ID', cell: (line) => line.id },
            { header: 'Item ID', cell: (line) => line.itemId },
            { header: 'Quantity', cell: (line) => line.quantity },
            { header: 'Unit Price', cell: (line) => line.unitPrice.toFixed(2) },
            { header: 'Line Total', cell: (line) => line.lineTotal.toFixed(2) },
          ]}
          rows={salesOrder.salesOrderLines}
          getRowKey={(line) => String(line.id)}
        />
      )}
      </Panel>
    </div>
  );
}
