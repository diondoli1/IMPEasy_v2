'use client';

import { useParams } from 'next/navigation';
import React from 'react';

import { CustomerWorkspace } from '../../../components/customer-workspace';

export default function CustomerDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();

  return <CustomerWorkspace customerId={Number(params.id)} />;
}
