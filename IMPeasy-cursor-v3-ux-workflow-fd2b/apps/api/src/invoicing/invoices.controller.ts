import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
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

  @Post()
  create(@Body() payload: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    return this.invoicingService.createFromSalesOrder(payload);
  }

  @Patch(':id/pay')
  @HttpCode(HttpStatus.OK)
  markPaid(@Param('id', ParseIntPipe) id: number): Promise<InvoiceResponseDto> {
    return this.invoicingService.markPaid(id);
  }
}
