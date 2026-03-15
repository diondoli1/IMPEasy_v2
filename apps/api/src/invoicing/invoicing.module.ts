import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { SettingsModule } from '../settings/settings.module';
import { ShippingModule } from '../shipping/shipping.module';
import { InvoicesController } from './invoices.controller';
import { InvoicingService } from './invoicing.service';
import { ShipmentInvoicesController } from './shipment-invoices.controller';

@Module({
  imports: [PrismaModule, ShippingModule, SalesOrdersModule, SettingsModule],
  controllers: [InvoicesController, ShipmentInvoicesController],
  providers: [InvoicingService],
  exports: [InvoicingService],
})
export class InvoicingModule {}
