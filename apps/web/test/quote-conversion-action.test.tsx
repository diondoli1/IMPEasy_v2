import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QuoteConversionAction } from '../components/quote-conversion-action';

describe('QuoteConversionAction', () => {
  it('shows no conversion action unless status is approved', () => {
    const { rerender } = render(<QuoteConversionAction status="draft" onConvert={async () => 1} />);
    expect(screen.queryByRole('button', { name: 'Convert to sales order' })).not.toBeInTheDocument();

    rerender(<QuoteConversionAction status="sent" onConvert={async () => 1} />);
    expect(screen.queryByRole('button', { name: 'Convert to sales order' })).not.toBeInTheDocument();

    rerender(<QuoteConversionAction status="approved" onConvert={async () => 1} />);
    expect(screen.getByRole('button', { name: 'Convert to sales order' })).toBeInTheDocument();
  });

  it('submits conversion and shows success feedback', async () => {
    render(<QuoteConversionAction status="approved" onConvert={async () => 42} />);

    fireEvent.click(screen.getByRole('button', { name: 'Convert to sales order' }));

    await waitFor(() => {
      expect(screen.getByText('Converted to Sales Order #42.')).toBeInTheDocument();
    });
  });

  it('shows error feedback when conversion fails', async () => {
    render(
      <QuoteConversionAction
        status="approved"
        onConvert={async () => {
          throw new Error('failed');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Convert to sales order' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to convert quote.');
    });
  });
});
