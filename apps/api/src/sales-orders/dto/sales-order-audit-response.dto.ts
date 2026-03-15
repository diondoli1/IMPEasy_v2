export class SalesOrderAuditResponseDto {
  id!: number;
  salesOrderId!: number;
  action!: string;
  fromStatus!: string | null;
  toStatus!: string;
  actor!: string;
  createdAt!: Date;
}
