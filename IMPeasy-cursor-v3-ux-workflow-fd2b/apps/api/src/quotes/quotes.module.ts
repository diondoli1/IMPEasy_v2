import { Module } from '@nestjs/common';

import { CrmModule } from '../crm/crm.module';
import { ItemsModule } from '../items/items.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { SettingsModule } from '../settings/settings.module';
import { QuoteLinesController } from './quote-lines.controller';
import { QuoteLinesService } from './quote-lines.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [PrismaModule, CrmModule, ItemsModule, SalesOrdersModule, SettingsModule],
  controllers: [QuotesController, QuoteLinesController],
  providers: [QuotesService, QuoteLinesService],
})
export class QuotesModule {}
