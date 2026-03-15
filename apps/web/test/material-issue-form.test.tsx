import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { MaterialIssueForm } from '../components/material-issue-form';

describe('MaterialIssueForm', () => {
  it('validates positive issue quantity', async () => {
    render(
      <MaterialIssueForm
        submitLabel="Issue"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Issue Quantity' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Issue quantity must be greater than zero.',
      );
    });
  });

  it('submits valid material issue payload', async () => {
    const submitted: Array<{ quantity: number; notes?: string }> = [];

    render(
      <MaterialIssueForm
        submitLabel="Issue"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Issue Quantity' }), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), {
      target: { value: 'Issue to WO-001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue' }));

    await waitFor(() => {
      expect(submitted).toEqual([{ quantity: 12, notes: 'Issue to WO-001' }]);
    });
  });
});
