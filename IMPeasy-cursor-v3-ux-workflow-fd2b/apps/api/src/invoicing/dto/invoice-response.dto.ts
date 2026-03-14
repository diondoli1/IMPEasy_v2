import { InvoiceLineResponseDto } from './invoice-line-response.dto';

export class InvoiceResponseDto {
  id!: number;
  number!: string;
  shipmentId!: number | null;
  shipmentNumber!: string | null;
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
