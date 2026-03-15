import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PurchaseOrderReceiptForm } from '../components/purchase-order-receipt-form';

describe('PurchaseOrderReceiptForm', () => {
  it('validates positive quantity and remaining quantity limit', async () => {
    render(
      <PurchaseOrderReceiptForm
        maxQuantity={2}
        submitLabel="Receive"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Lot Number' }), {
      target: { value: 'LOT-AL-001' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Receipt Quantity' }), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Receipt quantity must be greater than zero.',
      );
    });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Receipt Quantity' }), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Receipt quantity cannot exceed remaining quantity (2).',
      );
    });
  });

  it('requires a lot number or an existing lot selection', async () => {
    render(
      <PurchaseOrderReceiptForm
        maxQuantity={5}
        submitLabel="Receive"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Choose an existing lot or enter a new lot number.',
      );
    });
  });

  it('submits a valid new-lot receipt payload', async () => {
    const submitted: Array<{
      quantity: number;
      lotNumber?: string;
      receiptDate?: string;
      notes?: string;
    }> = [];

    render(
      <PurchaseOrderReceiptForm
        maxQuantity={5}
        submitLabel="Receive"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Receipt Quantity' }), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Lot Number' }), {
      target: { value: 'LOT-AL-002' },
    });
    fireEvent.change(screen.getByLabelText('Receipt Date'), {
      target: { value: '2026-03-11' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), {
      target: { value: 'First pallet' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));

    await waitFor(() => {
      expect(submitted).toEqual([
        {
          quantity: 4,
          lotNumber: 'LOT-AL-002',
          receiptDate: '2026-03-11',
          notes: 'First pallet',
        },
      ]);
    });

    expect(screen.getByText('Receipt recorded.')).toBeInTheDocument();
  });

  it('submits an existing-lot receipt payload', async () => {
    const submitted: Array<{
      quantity: number;
      existingLotId?: number;
    }> = [];

    render(
      <PurchaseOrderReceiptForm
        maxQuantity={5}
        existingLots={[
          {
            id: 44,
            lotNumber: 'LOT-AL-001',
          },
        ]}
        submitLabel="Receive"
        onSubmit={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Existing Lot' }), {
      target: { value: '44' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Receipt Quantity' }), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));

    await waitFor(() => {
      expect(submitted).toEqual([
        {
          quantity: 2,
          existingLotId: 44,
        },
      ]);
    });
  });

  it('shows fully received state when no remaining quantity exists', () => {
    render(
      <PurchaseOrderReceiptForm
        maxQuantity={0}
        submitLabel="Receive"
        onSubmit={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    expect(screen.getByText('Fully received.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Receive' })).not.toBeInTheDocument();
  });
});
