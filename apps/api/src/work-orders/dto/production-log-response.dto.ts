export class ProductionLogResponseDto {
  id!: number;
  operationId!: number;
  quantity!: number;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
