import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { InventoryAdjustmentForm } from '../components/inventory-adjustment-form';

describe('InventoryAdjustmentForm', () => {
  it('validates non-zero adjustment delta', async () => {
    render(
      <InventoryAdjustmentForm
        submitLabel="Adjust"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Adjustment Delta' }), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adjust' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Adjustment delta must be greater than zero or less than zero.',
      );
    });
  });

  it('submits valid adjustment payload', async () => {
    const submitted: Array<{ delta: number; notes?: string }> = [];

    render(
      <InventoryAdjustmentForm
        submitLabel="Adjust"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Adjustment Delta' }), {
      target: { value: '-4' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), {
      target: { value: 'Cycle count correction' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adjust' }));

    await waitFor(() => {
      expect(submitted).toEqual([{ delta: -4, notes: 'Cycle count correction' }]);
    });
  });
});
