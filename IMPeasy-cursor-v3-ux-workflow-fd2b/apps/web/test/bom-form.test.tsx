import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BomForm } from '../components/bom-form';

describe('BomForm', () => {
  it('validates required fields', async () => {
    render(
      <BomForm
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
    const submitted: Array<{ itemId: number; name: string; description?: string }> = [];

    render(
      <BomForm
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
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Frame Assembly BOM' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Initial BOM header' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        itemId: 1,
        name: 'Frame Assembly BOM',
        description: 'Initial BOM header',
      });
    });
  });
});
