import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { ShippingAvailabilityLineDto } from './dto/shipping-availability-line.dto';
import { ShippingService } from './shipping.service';

@Controller('sales-orders/:salesOrderId')
@Roles('admin', 'office')
export class SalesOrderShipmentsController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('shipments')
  listBySalesOrder(
    @Param('salesOrderId', ParseIntPipe) salesOrderId: number,
  ): Promise<ShipmentResponseDto[]> {
    return this.shippingService.listBySalesOrder(salesOrderId);
  }

  @Get('shipping-availability')
  listAvailability(
    @Param('salesOrderId', ParseIntPipe) salesOrderId: number,
  ): Promise<ShippingAvailabilityLineDto[]> {
    return this.shippingService.listAvailabilityBySalesOrder(salesOrderId);
  }
}
