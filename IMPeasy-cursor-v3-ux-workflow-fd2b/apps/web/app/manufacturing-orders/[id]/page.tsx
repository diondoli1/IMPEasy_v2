'use client';

import { useParams } from 'next/navigation';
import React from 'react';

import { ManufacturingOrderWorkspace } from '../../../components/manufacturing-order-workspace';

export default function ManufacturingOrderDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  return <ManufacturingOrderWorkspace manufacturingOrderId={Number(params.id)} />;
}
