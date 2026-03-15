import { IsInt, IsNumber, Min } from 'class-validator';

export class CreatePurchaseOrderLineDto {
  @IsInt()
  @Min(1)
  itemId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}
