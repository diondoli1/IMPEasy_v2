import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { QuoteConversionResponseDto } from './dto/quote-conversion-response.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteDetailResponseDto } from './dto/quote-detail-response.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@Controller('quotes')
@Roles('admin', 'office')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  findAll(): Promise<QuoteResponseDto[]> {
    return this.quotesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<QuoteDetailResponseDto> {
    return this.quotesService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateQuoteDto): Promise<QuoteDetailResponseDto> {
    return this.quotesService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateQuoteDto,
  ): Promise<QuoteDetailResponseDto> {
    return this.quotesService.update(id, payload);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateQuoteStatusDto,
  ): Promise<QuoteDetailResponseDto> {
    return this.quotesService.updateStatus(id, payload);
  }

  @Post(':id/convert')
  convertToSalesOrder(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuoteConversionResponseDto> {
    return this.quotesService.convertToSalesOrder(id);
  }
}
