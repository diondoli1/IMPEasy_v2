import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PurchaseOrderLineForm } from '../components/purchase-order-line-form';

describe('PurchaseOrderLineForm', () => {
  it('validates required fields', async () => {
    render(
      <PurchaseOrderLineForm
        items={[{ id: 1, name: 'Aluminum Plate 10mm' }]}
        submitLabel="Add line"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add line' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Item is required.');
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ itemId: number; quantity: number; unitPrice: number }> = [];

    render(
      <PurchaseOrderLineForm
        items={[{ id: 1, name: 'Aluminum Plate 10mm' }]}
        submitLabel="Add line"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Item' }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantity' }), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Unit Price' }), {
      target: { value: '12.5' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add line' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        itemId: 1,
        quantity: 5,
        unitPrice: 12.5,
      });
    });
  });
});
