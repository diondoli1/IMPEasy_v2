import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ItemForm } from '../components/item-form';

describe('ItemForm', () => {
  it('validates required name', async () => {
    render(
      <ItemForm
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ name: string; description?: string }> = [];

    render(
      <ItemForm
        submitLabel="Save"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Aluminum Plate 10mm' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Raw stock material' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        name: 'Aluminum Plate 10mm',
        description: 'Raw stock material',
      });
    });
  });
});
