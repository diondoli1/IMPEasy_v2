import { IsInt, Min } from 'class-validator';
import { IsOptional, IsString } from 'class-validator';

export class CreateBomItemDto {
  @IsInt()
  @Min(1)
  itemId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rowOrder?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
