'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { ContactForm } from '../../../../../components/contact-form';
import { createContact } from '../../../../../lib/api';

export default function NewContactPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = Number(params.id);

  return (
    <section>
      <h1>Create Contact</h1>
      <p>
        <Link href={`/customers/${customerId}`}>Back to customer</Link>
      </p>
      <ContactForm
        submitLabel="Create contact"
        onSubmit={async (payload) => {
          const contact = await createContact(customerId, payload);
          router.push(`/contacts/${contact.id}`);
        }}
      />
    </section>
  );
}


