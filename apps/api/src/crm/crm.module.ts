import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [CustomersController, ContactsController],
  providers: [CustomersService, ContactsService],
  exports: [CustomersService],
})
export class CrmModule {}
