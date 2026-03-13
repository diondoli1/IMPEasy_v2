import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { InvoiceRegisterResponseDto } from './dto/invoice-register-response.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoicingService } from './invoicing.service';

@Controller('invoices')
@Roles('admin', 'office')
export class InvoicesController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get()
  findAll(): Promise<InvoiceRegisterResponseDto[]> {
    return this.invoicingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InvoiceResponseDto> {
    return this.invoicingService.findOne(id);
  }
}
