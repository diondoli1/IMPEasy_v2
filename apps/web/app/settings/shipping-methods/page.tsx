import React from 'react';

import { SettingsListPage } from '../../../components/settings-list-preview-page';

export default function ShippingMethodsPage(): JSX.Element {
  return (
    <SettingsListPage
      title="Shipping methods"
      description="List CRUD for carrier and delivery methods."
      listType="shipping_methods"
    />
  );
}
