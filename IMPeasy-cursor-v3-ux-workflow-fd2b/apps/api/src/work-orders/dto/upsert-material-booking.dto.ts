import { IsInt, Min } from 'class-validator';

export class UpsertMaterialBookingDto {
  @IsInt()
  @Min(1)
  bomItemId!: number;

  @IsInt()
  @Min(1)
  stockLotId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
