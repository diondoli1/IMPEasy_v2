import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CustomerForm } from '../components/customer-form';

describe('CustomerForm', () => {
  it('validates required name and invalid email', async () => {
    render(
      <CustomerForm
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Acme' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'invalid-email' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Email must be valid.');
  });

  it('submits valid payload', async () => {
    const submitted: Array<{ name: string; email?: string; phone?: string }> = [];

    render(
      <CustomerForm
        submitLabel="Save"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Acme Industries' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'ops@acme.test' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        name: 'Acme Industries',
        email: 'ops@acme.test',
        phone: undefined,
      });
    });
  });
});
