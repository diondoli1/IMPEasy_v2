import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ContactForm } from '../components/contact-form';

describe('ContactForm', () => {
  it('validates required name and invalid email', async () => {
    render(
      <ContactForm
        submitLabel="Save"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Jordan Smith' },
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
      <ContactForm
        submitLabel="Save"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Jordan Smith' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'jordan@atlas.test' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        name: 'Jordan Smith',
        email: 'jordan@atlas.test',
        phone: undefined,
      });
    });
  });
});
