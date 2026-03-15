import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { PurchaseOrderLinesService } from './purchase-order-lines.service';
import { CreatePurchaseOrderLineDto } from './dto/create-purchase-order-line.dto';
import { PurchaseOrderLineResponseDto } from './dto/purchase-order-line-response.dto';
import { ReceivePurchaseOrderLineDto } from './dto/receive-purchase-order-line.dto';

@Controller('purchase-orders/:purchaseOrderId/lines')
@Roles('admin', 'office')
export class PurchaseOrderLinesController {
  constructor(private readonly purchaseOrderLinesService: PurchaseOrderLinesService) {}

  @Get()
  listByPurchaseOrder(
    @Param('purchaseOrderId', ParseIntPipe) purchaseOrderId: number,
  ): Promise<PurchaseOrderLineResponseDto[]> {
    return this.purchaseOrderLinesService.listByPurchaseOrder(purchaseOrderId);
  }

  @Post()
  create(
    @Param('purchaseOrderId', ParseIntPipe) purchaseOrderId: number,
    @Body() payload: CreatePurchaseOrderLineDto,
  ): Promise<PurchaseOrderLineResponseDto> {
    return this.purchaseOrderLinesService.create(purchaseOrderId, payload);
  }

  @Post(':lineId/receive')
  receive(
    @Param('purchaseOrderId', ParseIntPipe) purchaseOrderId: number,
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() payload: ReceivePurchaseOrderLineDto,
  ): Promise<PurchaseOrderLineResponseDto> {
    return this.purchaseOrderLinesService.receive(purchaseOrderId, lineId, payload);
  }
}
