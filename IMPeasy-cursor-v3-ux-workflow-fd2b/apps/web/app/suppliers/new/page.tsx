'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SupplierForm } from '../../../components/supplier-form';
import { createSupplier } from '../../../lib/api';

export default function NewSupplierPage(): JSX.Element {
  const router = useRouter();

  return (
    <section>
      <h1>Create Supplier</h1>
      <p>
        <Link href="/suppliers">Back to suppliers</Link>
      </p>
      <SupplierForm
        submitLabel="Create supplier"
        onSubmit={async (payload) => {
          const supplier = await createSupplier(payload);
          router.push(`/suppliers/${supplier.id}`);
        }}
      />
    </section>
  );
}
