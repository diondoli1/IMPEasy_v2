import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { SalesOrderAuditResponseDto } from './dto/sales-order-audit-response.dto';
import { SalesOrderDetailResponseDto } from './dto/sales-order-detail-response.dto';
import { SalesOrderResponseDto } from './dto/sales-order-response.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { SalesOrdersService } from './sales-orders.service';

@Controller('sales-orders')
@Roles('admin', 'office')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  findAll(): Promise<SalesOrderResponseDto[]> {
    return this.salesOrdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SalesOrderDetailResponseDto> {
    return this.salesOrdersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSalesOrderDto,
  ): Promise<SalesOrderDetailResponseDto> {
    return this.salesOrdersService.update(id, payload);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSalesOrderStatusDto,
  ): Promise<SalesOrderResponseDto> {
    return this.salesOrdersService.updateStatus(id, payload);
  }

  @Get(':id/audit')
  listAuditTrail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesOrderAuditResponseDto[]> {
    return this.salesOrdersService.listAuditTrail(id);
  }
}
