import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderDetailResponseDto } from './dto/purchase-order-detail-response.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@Controller('purchase-orders')
@Roles('admin', 'office')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(): Promise<PurchaseOrderResponseDto[]> {
    return this.purchaseOrdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PurchaseOrderDetailResponseDto> {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.create(payload);
  }
}
