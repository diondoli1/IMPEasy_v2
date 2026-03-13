import { Module } from '@nestjs/common';

import { InventoryModule } from '../inventory/inventory.module';
import { ItemsModule } from '../items/items.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { ItemVendorTermsController } from './item-vendor-terms.controller';
import { PurchaseOrderLinesController } from './purchase-order-lines.controller';
import { PurchaseOrderLinesService } from './purchase-order-lines.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [PrismaModule, ItemsModule, InventoryModule, SettingsModule],
  controllers: [
    SuppliersController,
    ItemVendorTermsController,
    PurchaseOrdersController,
    PurchaseOrderLinesController,
  ],
  providers: [SuppliersService, PurchaseOrdersService, PurchaseOrderLinesService],
  exports: [SuppliersService, PurchaseOrdersService],
})
export class PurchasingModule {}
