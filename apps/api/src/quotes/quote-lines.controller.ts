import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateQuoteLineDto } from './dto/create-quote-line.dto';
import { QuoteLineResponseDto } from './dto/quote-line-response.dto';
import { QuoteLinesService } from './quote-lines.service';

@Controller('quotes/:quoteId/lines')
@Roles('admin', 'office')
export class QuoteLinesController {
  constructor(private readonly quoteLinesService: QuoteLinesService) {}

  @Get()
  listByQuote(@Param('quoteId', ParseIntPipe) quoteId: number): Promise<QuoteLineResponseDto[]> {
    return this.quoteLinesService.listByQuote(quoteId);
  }

  @Post()
  create(
    @Param('quoteId', ParseIntPipe) quoteId: number,
    @Body() payload: CreateQuoteLineDto,
  ): Promise<QuoteLineResponseDto> {
    return this.quoteLinesService.create(quoteId, payload);
  }
}
