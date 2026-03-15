import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductionLogDto {
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
