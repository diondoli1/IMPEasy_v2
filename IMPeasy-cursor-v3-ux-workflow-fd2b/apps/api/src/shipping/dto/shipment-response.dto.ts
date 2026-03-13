import { ShipmentLineResponseDto } from './shipment-line-response.dto';

export class ShipmentResponseDto {
  id!: number;
  number!: string;
  salesOrderId!: number;
  salesOrderNumber!: string;
  customerId!: number;
  customerName!: string;
  status!: string;
  shipDate!: Date | null;
  carrierMethod!: string | null;
  trackingNumber!: string | null;
  deliveredAt!: Date | null;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  shipmentLines!: ShipmentLineResponseDto[];
}
