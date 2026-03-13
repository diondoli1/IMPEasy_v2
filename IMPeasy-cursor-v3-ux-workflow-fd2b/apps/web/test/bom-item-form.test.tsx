import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BomItemForm } from '../components/bom-item-form';

describe('BomItemForm', () => {
  it('validates required item and quantity', async () => {
    render(
      <BomItemForm
        items={[{ id: 1, name: 'Frame Assembly' }]}
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Item is required.');
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ itemId: number; quantity: number }> = [];

    render(
      <BomItemForm
        items={[{ id: 1, name: 'Frame Assembly' }]}
        submitLabel="Save"
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

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        itemId: 1,
        quantity: 5,
      });
    });
  });
});
