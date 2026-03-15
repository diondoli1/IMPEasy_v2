import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PurchaseOrderForm } from '../components/purchase-order-form';

describe('PurchaseOrderForm', () => {
  it('validates required supplier', async () => {
    render(
      <PurchaseOrderForm
        suppliers={[{ id: 1, name: 'Nova Metals GmbH' }]}
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Supplier is required.');
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ supplierId: number; notes?: string }> = [];

    render(
      <PurchaseOrderForm
        suppliers={[{ id: 1, name: 'Nova Metals GmbH' }]}
        submitLabel="Save"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Supplier' }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), {
      target: { value: 'Restock aluminum plate' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        supplierId: 1,
        notes: 'Restock aluminum plate',
      });
    });
  });
});
