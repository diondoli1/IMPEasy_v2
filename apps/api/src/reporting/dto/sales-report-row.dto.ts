export class SalesReportRowDto {
  salesOrderId!: number;
  quoteId!: number;
  customerId!: number;
  customerName!: string;
  salesOrderStatus!: string;
  orderedQuantity!: number;
  orderedAmount!: number;
  shippedQuantity!: number;
  shippedAmount!: number;
  invoiceIssuedAmount!: number;
  invoicePaidAmount!: number;
  outstandingInvoiceAmount!: number;
  shipmentCount!: number;
  deliveredShipmentCount!: number;
  invoiceIssuedCount!: number;
  invoicePaidCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
