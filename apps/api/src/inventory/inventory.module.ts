import { Module } from '@nestjs/common';

import { ItemsModule } from '../items/items.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockController } from './stock.controller';

@Module({
  imports: [PrismaModule, ItemsModule, SettingsModule],
  controllers: [InventoryController, StockController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
