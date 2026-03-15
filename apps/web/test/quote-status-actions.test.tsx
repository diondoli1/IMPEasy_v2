import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QuoteStatusActions } from '../components/quote-status-actions';

describe('QuoteStatusActions', () => {
  it('shows draft action and submits sent transition', async () => {
    const transitions: string[] = [];

    render(
      <QuoteStatusActions
        status="draft"
        onTransition={async (nextStatus) => {
          transitions.push(nextStatus);
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark as sent' }));

    await waitFor(() => {
      expect(transitions).toEqual(['sent']);
    });
  });

  it('shows sent actions and submits selected transition', async () => {
    const transitions: string[] = [];

    render(
      <QuoteStatusActions
        status="sent"
        onTransition={async (nextStatus) => {
          transitions.push(nextStatus);
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    await waitFor(() => {
      expect(transitions).toEqual(['rejected']);
    });
  });

  it('hides actions when no transition is available', () => {
    render(<QuoteStatusActions status="approved" onTransition={async () => {}} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('No status actions available.')).toBeInTheDocument();
  });

  it('shows an error when transition update fails', async () => {
    render(
      <QuoteStatusActions
        status="draft"
        onTransition={async () => {
          throw new Error('failed');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark as sent' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to update quote status.');
    });
  });
});
