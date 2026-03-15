'use client';

import { useEffect, useState } from 'react';

import { OperationQueueTable } from '../../../components/operation-queue-table';
import { listOperationQueue } from '../../../lib/api';
import type { OperationQueueEntry } from '../../../types/operation';

export default function OperationQueuePage(): JSX.Element {
  const [entries, setEntries] = useState<OperationQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await listOperationQueue();
        setEntries(data);
      } catch {
        setError('Unable to load operation queue.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading operation queue...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h1>Operation Queue</h1>
      <OperationQueueTable entries={entries} />
    </section>
  );
}
