import React from 'react';
import { render, screen } from '@testing-library/react';

import { OperationQueueTable } from '../components/operation-queue-table';

describe('OperationQueueTable', () => {
  it('renders empty queue state', () => {
    render(<OperationQueueTable entries={[]} />);
    expect(screen.getByText('No queued operations found.')).toBeInTheDocument();
  });

  it('renders queue entries', () => {
    render(
      <OperationQueueTable
        entries={[
          {
            id: 5,
            workOrderId: 2,
            salesOrderId: 1,
            salesOrderLineId: 7,
            routingOperationId: 3,
            operationName: 'Laser Cutting',
            sequence: 10,
            plannedQuantity: 50,
            status: 'ready',
          },
        ]}
      />,
    );

    expect(screen.getByText('Laser Cutting')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '5' })).toHaveAttribute('href', '/operations/5');
    expect(screen.getByText('WO #2')).toBeInTheDocument();
    expect(screen.getByText('SO #1')).toBeInTheDocument();
  });
});
