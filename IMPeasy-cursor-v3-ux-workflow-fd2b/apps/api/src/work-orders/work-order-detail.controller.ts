import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { WorkOrderDetailResponseDto } from './dto/work-order-detail-response.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
@Roles('admin', 'planner')
export class WorkOrderDetailController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkOrderDetailResponseDto> {
    return this.workOrdersService.findOne(id);
  }
}
