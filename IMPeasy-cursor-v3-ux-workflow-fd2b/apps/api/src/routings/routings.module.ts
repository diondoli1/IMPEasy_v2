import { Module } from '@nestjs/common';

import { ItemsModule } from '../items/items.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoutingsController } from './routings.controller';
import { RoutingsService } from './routings.service';

@Module({
  imports: [PrismaModule, ItemsModule],
  controllers: [RoutingsController],
  providers: [RoutingsService],
  exports: [RoutingsService],
})
export class RoutingsModule {}
