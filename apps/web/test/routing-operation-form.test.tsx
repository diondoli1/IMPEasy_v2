import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RoutingOperationForm } from '../components/routing-operation-form';

describe('RoutingOperationForm', () => {
  it('validates required name', async () => {
    render(
      <RoutingOperationForm
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');
  });

  it('validates sequence greater than zero', async () => {
    render(
      <RoutingOperationForm
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Sequence' }), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Laser Cutting' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Sequence must be greater than zero.');
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ sequence: number; name: string; description?: string }> = [];

    render(
      <RoutingOperationForm
        submitLabel="Save"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Sequence' }), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Laser Cutting' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Initial cut operation' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        sequence: 10,
        name: 'Laser Cutting',
        description: 'Initial cut operation',
      });
    });
  });
});
