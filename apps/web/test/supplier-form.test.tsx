import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SupplierForm } from '../components/supplier-form';

describe('SupplierForm', () => {
  it('validates required name and invalid email', async () => {
    render(
      <SupplierForm
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Nova Metals');
    await user.type(screen.getByLabelText('Email'), 'invalid-email');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Email must be valid.');
  });

  it('submits valid payload including status changes', async () => {
    const submitted: Array<{
      name: string;
      email?: string;
      phone?: string;
      isActive?: boolean;
    }> = [];

    render(
      <SupplierForm
        initial={{
          id: 1,
          name: 'Nova Metals GmbH',
          email: 'sales@novametals.test',
          phone: '+49 30 7654321',
          isActive: true,
          createdAt: '2026-03-10T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
        }}
        submitLabel="Save"
        allowStatusChange
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Phone' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Active supplier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted).toEqual([
        {
          name: 'Nova Metals GmbH',
          email: '',
          phone: '',
          isActive: false,
        },
      ]);
    });
  });
});
