import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoicingService } from './invoicing.service';

@Controller('shipments/:shipmentId')
@Roles('admin', 'office')
export class ShipmentInvoicesController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get('invoice')
  findByShipmentId(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.findByShipmentId(shipmentId);
  }

  @Post('invoice')
  createForShipment(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.createForShipment(shipmentId);
  }

  @Post('invoice/pay')
  @HttpCode(HttpStatus.OK)
  markPaidForShipment(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.markPaidForShipment(shipmentId);
  }
}
