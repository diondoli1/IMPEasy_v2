'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ContactForm } from '../../../components/contact-form';
import { getContact, updateContact } from '../../../lib/api';
import type { Contact } from '../../../types/contact';

export default function ContactDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getContact(id);
        setContact(data);
      } catch {
        setError('Contact not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading contact...</p>;
  }

  if (error || !contact) {
    return (
      <section>
        <p role="alert">{error ?? 'Contact not found.'}</p>
        <p>
          <Link href="/customers">Back to customers</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Contact #{contact.id}</h1>
      <p>
        <Link href={`/customers/${contact.customerId}`}>Back to customer</Link>
      </p>
      <ContactForm
        initial={contact}
        submitLabel="Update contact"
        onSubmit={async (payload) => {
          const updated = await updateContact(id, payload);
          setContact(updated);
        }}
      />
    </section>
  );
}
