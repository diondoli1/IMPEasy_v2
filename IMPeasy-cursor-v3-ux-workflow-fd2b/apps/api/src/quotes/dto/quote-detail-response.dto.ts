import { QuoteLineResponseDto } from './quote-line-response.dto';
import { QuoteResponseDto } from './quote-response.dto';

export class QuoteDetailResponseDto extends QuoteResponseDto {
  quoteLines!: QuoteLineResponseDto[];
}
