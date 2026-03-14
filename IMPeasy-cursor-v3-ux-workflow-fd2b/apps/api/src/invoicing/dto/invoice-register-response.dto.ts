export class InvoiceRegisterResponseDto {
  id!: number;
  number!: string;
  customerId!: number;
  customerName!: string;
  salesOrderId!: number;
  salesOrderNumber!: string;
  shipmentId!: number | null;
  shipmentNumber!: string | null;
  status!: string;
  totalAmount!: number;
  issueDate!: Date;
  dueDate!: Date | null;
  paidAt!: Date | null;
}
