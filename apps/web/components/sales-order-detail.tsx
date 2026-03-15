import Link from 'next/link';
import React from 'react';

import type { SalesOrderDetail } from '../types/sales-order';

type SalesOrderDetailProps = {
  salesOrder: SalesOrderDetail;
};

export function SalesOrderDetailView({ salesOrder }: SalesOrderDetailProps): JSX.Element {
  return (
    <section>
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
      <h2>Sales Order Lines</h2>
      {salesOrder.salesOrderLines.length === 0 ? (
        <p>No sales order lines found.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Item ID</th>
              <th align="left">Quantity</th>
              <th align="left">Unit Price</th>
              <th align="left">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {salesOrder.salesOrderLines.map((line) => (
              <tr key={line.id}>
                <td>{line.id}</td>
                <td>{line.itemId}</td>
                <td>{line.quantity}</td>
                <td>{line.unitPrice.toFixed(2)}</td>
                <td>{line.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
