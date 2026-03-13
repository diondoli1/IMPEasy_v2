import { InvoiceLineResponseDto } from './invoice-line-response.dto';

export class InvoiceResponseDto {
  id!: number;
  number!: string;
  shipmentId!: number;
  shipmentNumber!: string;
  salesOrderId!: number;
  salesOrderNumber!: string;
  customerId!: number;
  customerName!: string;
  status!: string;
  issueDate!: Date;
  dueDate!: Date | null;
  paidAt!: Date | null;
  totalAmount!: number;
  createdAt!: Date;
  updatedAt!: Date;
  invoiceLines!: InvoiceLineResponseDto[];
}
