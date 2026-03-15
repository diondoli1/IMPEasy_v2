export class UnitOfMeasureResponseDto {
  id!: number;
  name!: string;
  baseUnit!: string | null;
  conversionRate!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
