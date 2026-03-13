import React from 'react';
import { render, screen } from '@testing-library/react';

import { WorkOrderDetailView } from '../components/work-order-detail';

describe('WorkOrderDetailView', () => {
  it('renders work order detail fields', () => {
    render(
      <WorkOrderDetailView
        workOrder={{
          id: 4,
          salesOrderId: 2,
          salesOrderLineId: 9,
          itemId: 7,
          routingId: 3,
          quantity: 12,
          status: 'planned',
          createdAt: '2026-03-10T10:00:00.000Z',
          updatedAt: '2026-03-10T10:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Work Order #4' })).toBeInTheDocument();
    expect(screen.getByText('Back to sales order #2')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('planned')).toBeInTheDocument();
  });
});
