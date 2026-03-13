import { IsInt, IsOptional, IsString, NotEquals } from 'class-validator';

export class CreateInventoryAdjustmentDto {
  @IsInt()
  @NotEquals(0)
  delta!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
