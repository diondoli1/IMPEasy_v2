import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { BomsModule } from './boms/boms.module';
import { CrmModule } from './crm/crm.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { InventoryModule } from './inventory/inventory.module';
import { ItemsModule } from './items/items.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { QualityModule } from './quality/quality.module';
import { QuotesModule } from './quotes/quotes.module';
import { ReportingModule } from './reporting/reporting.module';
import { RoutingsModule } from './routings/routings.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { SettingsModule } from './settings/settings.module';
import { ShippingModule } from './shipping/shipping.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    AuthModule,
    CrmModule,
    InvoicingModule,
    ItemsModule,
    InventoryModule,
    PurchasingModule,
    QualityModule,
    BomsModule,
    ReportingModule,
    RoutingsModule,
    SalesOrdersModule,
    SettingsModule,
    ShippingModule,
    WorkOrdersModule,
    QuotesModule,
  ],
})
export class AppModule {}
