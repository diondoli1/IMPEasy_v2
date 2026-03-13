import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { InventoryItemForm } from '../components/inventory-item-form';

describe('InventoryItemForm', () => {
  it('validates required item and non-negative quantity', async () => {
    const { unmount } = render(
      <InventoryItemForm
        items={[{ id: 1, name: 'Aluminum Plate 10mm' }]}
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Item is required.');

    unmount();

    render(
      <InventoryItemForm
        items={[{ id: 1, name: 'Aluminum Plate 10mm' }]}
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    const itemSelect = screen.getByRole('combobox', { name: 'Item' }) as HTMLSelectElement;
    fireEvent.change(itemSelect, {
      target: { value: '1' },
    });
    expect(itemSelect.value).toBe('1');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantity On Hand' }), {
      target: { value: '' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Quantity on hand must be zero or greater.',
      );
    });
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ itemId: number; quantityOnHand?: number }> = [];

    render(
      <InventoryItemForm
        items={[
          { id: 1, name: 'Aluminum Plate 10mm' },
          { id: 2, name: 'Steel Tube 20mm' },
        ]}
        submitLabel="Save"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Item' }), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantity On Hand' }), {
      target: { value: '75' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted).toEqual([{ itemId: 2, quantityOnHand: 75 }]);
    });
  });
});
