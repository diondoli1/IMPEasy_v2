import { Module } from '@nestjs/common';

import { InventoryModule } from '../inventory/inventory.module';
import { ItemsModule } from '../items/items.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutingsModule } from '../routings/routings.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { SettingsModule } from '../settings/settings.module';
import { ManufacturingOrdersController } from './manufacturing-orders.controller';
import { OperationsController } from './operations.controller';
import { WorkOrderDetailController } from './work-order-detail.controller';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [
    PrismaModule,
    SalesOrdersModule,
    ItemsModule,
    RoutingsModule,
    InventoryModule,
    SettingsModule,
  ],
  controllers: [
    WorkOrdersController,
    WorkOrderDetailController,
    ManufacturingOrdersController,
    OperationsController,
  ],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
