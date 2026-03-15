import React from 'react';

import { SettingsListPage } from '../../../components/settings-list-preview-page';

export default function TaxRatesPage(): JSX.Element {
  return (
    <SettingsListPage
      title="Tax rates"
      description="Simple tax-rate list CRUD for compact setup. Advanced tax logic stays out of MVP scope."
      listType="tax_rates"
      numericField={{
        label: 'Rate',
        placeholder: '19',
        suffix: '%',
      }}
    />
  );
}
