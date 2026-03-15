import { Body, Controller, Get, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateVendorInvoiceDto } from './dto/create-vendor-invoice.dto';
import { VendorInvoiceResponseDto } from './dto/vendor-invoice-response.dto';
import { VendorInvoicesService } from './vendor-invoices.service';

@Controller('vendor-invoices')
@Roles('admin', 'office')
export class VendorInvoicesController {
  constructor(private readonly vendorInvoicesService: VendorInvoicesService) {}

  @Get()
  listAll(): Promise<VendorInvoiceResponseDto[]> {
    return this.vendorInvoicesService.findAll();
  }

  @Post()
  create(@Body() payload: CreateVendorInvoiceDto): Promise<VendorInvoiceResponseDto> {
    return this.vendorInvoicesService.create(payload);
  }
}
