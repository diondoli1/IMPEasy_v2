'use client';

import Link from 'next/link';
import React, { useState } from 'react';

type QuoteConversionActionProps = {
  status: string;
  onConvert: () => Promise<number>;
};

export function QuoteConversionAction({
  status,
  onConvert,
}: QuoteConversionActionProps): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [salesOrderId, setSalesOrderId] = useState<number | null>(null);

  if (status !== 'approved') {
    return null;
  }

  const handleConvert = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSalesOrderId(null);

    try {
      const createdSalesOrderId = await onConvert();
      setSuccess(`Converted to Sales Order #${createdSalesOrderId}.`);
      setSalesOrderId(createdSalesOrderId);
    } catch {
      setError('Unable to convert quote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Conversion</h2>
      <button type="button" onClick={() => void handleConvert()} disabled={loading}>
        {loading ? 'Converting...' : 'Convert to sales order'}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
      {salesOrderId ? (
        <p>
          <Link href={`/sales-orders/${salesOrderId}`}>Open Sales Order #{salesOrderId}</Link>
        </p>
      ) : null}
    </section>
  );
}
