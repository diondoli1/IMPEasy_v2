import React from 'react';

import { SettingsListPage } from '../../../components/settings-list-preview-page';

export default function PaymentTermsPage(): JSX.Element {
  return (
    <SettingsListPage
      title="Payment terms"
      description="Simple payment-term list CRUD persisted through the settings API."
      listType="payment_terms"
    />
  );
}
