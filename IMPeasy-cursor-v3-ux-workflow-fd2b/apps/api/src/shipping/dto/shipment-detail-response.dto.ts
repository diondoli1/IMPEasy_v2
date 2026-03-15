import { InvoiceResponseDto } from '../../invoicing/dto/invoice-response.dto';
import { StockLotResponseDto } from '../../inventory/dto/stock-lot-response.dto';
import { ShipmentLineResponseDto } from './shipment-line-response.dto';
import { ShipmentPickResponseDto } from './shipment-pick-response.dto';
import { ShipmentResponseDto } from './shipment-response.dto';

export class ShipmentHistoryEntryResponseDto {
  eventType!: string;
  message!: string;
  eventDate!: Date;
}

export class ShipmentLineAvailabilityResponseDto extends ShipmentLineResponseDto {
  availableLots!: StockLotResponseDto[];
  picks!: ShipmentPickResponseDto[];
}

export class ShipmentDetailResponseDto extends ShipmentResponseDto {
  shipToName!: string;
  shipToAddress!: string[];
  invoice!: InvoiceResponseDto | null;
  lines!: ShipmentLineAvailabilityResponseDto[];
  history!: ShipmentHistoryEntryResponseDto[];
}
