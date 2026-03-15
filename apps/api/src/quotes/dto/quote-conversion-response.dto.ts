import { SalesOrderResponseDto } from '../../sales-orders/dto/sales-order-response.dto';
import { QuoteResponseDto } from './quote-response.dto';

export class QuoteConversionResponseDto {
  quote!: QuoteResponseDto;
  salesOrder!: SalesOrderResponseDto;
}
