import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QuoteForm } from '../components/quote-form';

describe('QuoteForm', () => {
  it('validates required customer', async () => {
    render(
      <QuoteForm
        customers={[{ id: 1, name: 'Acme Industries' }]}
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Customer is required.');
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ customerId: number; notes?: string }> = [];

    render(
      <QuoteForm
        customers={[{ id: 1, name: 'Acme Industries' }]}
        submitLabel="Save"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Customer' }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), {
      target: { value: 'Initial RFQ quote' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        customerId: 1,
        notes: 'Initial RFQ quote',
      });
    });
  });
});
