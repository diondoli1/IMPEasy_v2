'use client';

import { useParams, useSearchParams } from 'next/navigation';
import React from 'react';

import { CustomerOrderWorkspace } from '../../../components/customer-order-workspace';

export default function CustomerOrderWorkspacePage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  return <CustomerOrderWorkspace workspaceId={params.id} initialTab={tabParam === 'production' ? 'production' : undefined} />;
}
