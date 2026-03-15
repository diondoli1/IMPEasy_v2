import Link from 'next/link';
import React from 'react';

import type { WorkOrderDetail } from '../types/work-order';

type WorkOrderDetailProps = {
  workOrder: WorkOrderDetail;
};

export function WorkOrderDetailView({ workOrder }: WorkOrderDetailProps): JSX.Element {
  return (
    <section>
      <h1>Work Order #{workOrder.id}</h1>
      <p>
        <Link href={`/sales-orders/${workOrder.salesOrderId}`}>
          Back to sales order #{workOrder.salesOrderId}
        </Link>
      </p>
      <dl>
        <dt>Sales Order ID</dt>
        <dd>{workOrder.salesOrderId}</dd>
        <dt>Sales Order Line ID</dt>
        <dd>{workOrder.salesOrderLineId}</dd>
        <dt>Item ID</dt>
        <dd>{workOrder.itemId}</dd>
        <dt>Routing ID</dt>
        <dd>{workOrder.routingId}</dd>
        <dt>Quantity</dt>
        <dd>{workOrder.quantity}</dd>
        <dt>Status</dt>
        <dd>{workOrder.status}</dd>
      </dl>
    </section>
  );
}
