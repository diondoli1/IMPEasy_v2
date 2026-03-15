import { SalesOrderResponseDto } from './sales-order-response.dto';
import { SalesOrderLineResponseDto } from './sales-order-line-response.dto';

export class SalesOrderDetailResponseDto extends SalesOrderResponseDto {
  salesOrderLines!: SalesOrderLineResponseDto[];
}
