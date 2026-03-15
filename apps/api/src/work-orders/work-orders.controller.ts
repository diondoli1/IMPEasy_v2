import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { WorkOrderResponseDto } from './dto/work-order-response.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('sales-orders/:salesOrderId/work-orders')
@Roles('admin', 'planner')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @Roles('admin', 'office', 'planner')
  listBySalesOrder(
    @Param('salesOrderId', ParseIntPipe) salesOrderId: number,
  ): Promise<WorkOrderResponseDto[]> {
    return this.workOrdersService.listBySalesOrder(salesOrderId);
  }

  @Post('generate')
  generateForSalesOrder(
    @Param('salesOrderId', ParseIntPipe) salesOrderId: number,
  ): Promise<WorkOrderResponseDto[]> {
    return this.workOrdersService.generateForSalesOrder(salesOrderId);
  }
}
