'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { ContactForm } from '../../../../../components/contact-form';
import { createContact } from '../../../../../lib/api';

export default function NewContactPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = Number(params.id);

  return (
    <section>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          component={Link}
          href={`/customers/${customerId}`}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Typography variant="h6">Create Contact</Typography>
      </Box>
      <ContactForm
        submitLabel="Create contact"
        onSubmit={async (payload) => {
          const contact = await createContact(customerId, payload);
          router.replace(`/contacts/${contact.id}`);
        }}
      />
    </section>
  );
}


