import { Module } from '@nestjs/common';

import { ItemsModule } from '../items/items.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BomsController } from './boms.controller';
import { BomsService } from './boms.service';

@Module({
  imports: [PrismaModule, ItemsModule],
  controllers: [BomsController],
  providers: [BomsService],
})
export class BomsModule {}
