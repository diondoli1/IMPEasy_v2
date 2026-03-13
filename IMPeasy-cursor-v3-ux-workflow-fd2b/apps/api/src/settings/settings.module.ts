import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { NumberingService } from './numbering.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService, NumberingService],
  exports: [SettingsService, NumberingService],
})
export class SettingsModule {}
