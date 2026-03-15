import React from 'react';

import { SettingsListPage } from '../../../components/settings-list-preview-page';

export default function ShippingTermsPage(): JSX.Element {
  return (
    <SettingsListPage
      title="Shipping terms"
      description="Compact list CRUD for trade and delivery terms used on commercial and shipping documents."
      listType="shipping_terms"
    />
  );
}
