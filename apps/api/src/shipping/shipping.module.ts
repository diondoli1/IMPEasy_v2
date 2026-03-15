import { Module } from '@nestjs/common';

import { InventoryModule } from '../inventory/inventory.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { SettingsModule } from '../settings/settings.module';
import { SalesOrderShipmentsController } from './sales-order-shipments.controller';
import { ShipmentsController } from './shipping.controller';
import { ShippingService } from './shipping.service';

@Module({
  imports: [PrismaModule, SalesOrdersModule, InventoryModule, SettingsModule],
  controllers: [ShipmentsController, SalesOrderShipmentsController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
