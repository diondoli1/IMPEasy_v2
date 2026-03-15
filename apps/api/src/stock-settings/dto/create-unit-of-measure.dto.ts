import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateUnitOfMeasureDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  baseUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  conversionRate?: number;
}
