import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateBomItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  itemId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rowOrder?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
