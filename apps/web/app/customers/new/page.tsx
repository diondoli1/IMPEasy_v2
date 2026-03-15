'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

import { CustomerWorkspace } from '../../../components/customer-workspace';

export default function NewCustomerPage(): JSX.Element {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;
  return <CustomerWorkspace returnTo={returnTo} />;
}
