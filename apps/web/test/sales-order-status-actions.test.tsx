import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SalesOrderStatusActions } from '../components/sales-order-status-actions';

describe('SalesOrderStatusActions', () => {
  it('shows lifecycle action for active statuses and none for closed', () => {
    const { rerender } = render(
      <SalesOrderStatusActions status="draft" onTransition={async () => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Confirm order' })).toBeInTheDocument();

    rerender(<SalesOrderStatusActions status="confirmed" onTransition={async () => {}} />);
    expect(screen.getByRole('button', { name: 'Release order' })).toBeInTheDocument();

    rerender(<SalesOrderStatusActions status="closed" onTransition={async () => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('No status actions available.')).toBeInTheDocument();
  });

  it('submits valid next status transition', async () => {
    const transitions: string[] = [];

    render(
      <SalesOrderStatusActions
        status="released"
        onTransition={async (nextStatus) => {
          transitions.push(nextStatus);
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark in production' }));

    await waitFor(() => {
      expect(transitions).toEqual(['in_production']);
    });
  });

  it('shows error when update fails', async () => {
    render(
      <SalesOrderStatusActions
        status="draft"
        onTransition={async () => {
          throw new Error('failed');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to update sales order status.');
    });
  });
});
