import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { StockSettingsController } from './stock-settings.controller';
import { StockSettingsService } from './stock-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [StockSettingsController],
  providers: [StockSettingsService],
  exports: [StockSettingsService],
})
export class StockSettingsModule {}
