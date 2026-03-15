'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { WorkOrderDetailView } from '../../../components/work-order-detail';
import { getWorkOrder } from '../../../lib/api';
import type { WorkOrderDetail } from '../../../types/work-order';

export default function WorkOrderDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getWorkOrder(id);
        setWorkOrder(data);
      } catch {
        setError('Work order not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading work order...</p>;
  }

  if (error || !workOrder) {
    return <p role="alert">{error ?? 'Work order not found.'}</p>;
  }

  return <WorkOrderDetailView workOrder={workOrder} />;
}
