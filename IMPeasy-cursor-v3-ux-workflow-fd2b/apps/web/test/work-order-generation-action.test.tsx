import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WorkOrderGenerationAction } from '../components/work-order-generation-action';

describe('WorkOrderGenerationAction', () => {
  it('shows no section unless sales order is released or work orders exist', () => {
    const { rerender } = render(
      <WorkOrderGenerationAction status="confirmed" workOrders={[]} onGenerate={async () => []} />,
    );
    expect(screen.queryByText('Work Orders')).not.toBeInTheDocument();

    rerender(
      <WorkOrderGenerationAction
        status="in_production"
        workOrders={[
          {
            id: 1,
            salesOrderLineId: 3,
            routingId: 7,
            quantity: 5,
            status: 'planned',
            createdAt: '2026-03-10T10:00:00.000Z',
            updatedAt: '2026-03-10T10:00:00.000Z',
          },
        ]}
        onGenerate={async () => []}
      />,
    );
    expect(screen.getByText('Work Orders')).toBeInTheDocument();
  });

  it('generates work orders and shows success feedback', async () => {
    render(
      <WorkOrderGenerationAction
        status="released"
        workOrders={[]}
        onGenerate={async () => [
          {
            id: 1,
            salesOrderLineId: 3,
            routingId: 7,
            quantity: 5,
            status: 'planned',
            createdAt: '2026-03-10T10:00:00.000Z',
            updatedAt: '2026-03-10T10:00:00.000Z',
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generate work orders' }));

    await waitFor(() => {
      expect(screen.getByText('Work orders ready: 1.')).toBeInTheDocument();
    });
  });

  it('shows error feedback when generation fails', async () => {
    render(
      <WorkOrderGenerationAction
        status="released"
        workOrders={[]}
        onGenerate={async () => {
          throw new Error('failed');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generate work orders' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to generate work orders.');
    });
  });
});
