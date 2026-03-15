import { IsInt, IsOptional, Min } from 'class-validator';

export class CompleteOperationDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  goodQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  scrapQuantity?: number;
}
