import { PurchaseOrderLineResponseDto } from './purchase-order-line-response.dto';
import { PurchaseReceiptResponseDto } from './purchase-receipt-response.dto';

export class PurchaseOrderHistoryEntryResponseDto {
  eventType!: string;
  message!: string;
  eventDate!: Date;
}

export class PurchaseOrderDetailResponseDto {
  id!: number;
  number!: string;
  supplierId!: number;
  supplierCode!: string | null;
  supplierName!: string;
  status!: string;
  supplierReference!: string | null;
  orderDate!: Date;
  expectedDate!: Date | null;
  buyer!: string | null;
  currency!: string;
  paymentTerm!: string | null;
  notes!: string | null;
  openQuantity!: number;
  receivedQuantity!: number;
  lines!: PurchaseOrderLineResponseDto[];
  receipts!: PurchaseReceiptResponseDto[];
  history!: PurchaseOrderHistoryEntryResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
