import { IsInt, Min } from 'class-validator';

export class UpdateMaterialBookingDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
