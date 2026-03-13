import { IsInt, Min } from 'class-validator';

export class CreateShipmentLineDto {
  @IsInt()
  @Min(1)
  salesOrderLineId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
