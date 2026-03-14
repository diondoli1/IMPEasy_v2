import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { WorkstationGroupsController } from './workstation-groups.controller';
import { WorkstationGroupsService } from './workstation-groups.service';
import { WorkstationsController } from './workstations.controller';
import { WorkstationsService } from './workstations.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkstationGroupsController, WorkstationsController],
  providers: [WorkstationGroupsService, WorkstationsService],
  exports: [WorkstationGroupsService, WorkstationsService],
})
export class WorkstationsModule {}
