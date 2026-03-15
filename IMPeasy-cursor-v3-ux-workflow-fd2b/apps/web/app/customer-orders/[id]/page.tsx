'use client';

import { useParams } from 'next/navigation';
import React from 'react';

import { CustomerOrderWorkspace } from '../../../components/customer-order-workspace';

export default function CustomerOrderWorkspacePage(): JSX.Element {
  const params = useParams<{ id: string }>();

  return <CustomerOrderWorkspace workspaceId={params.id} />;
}
