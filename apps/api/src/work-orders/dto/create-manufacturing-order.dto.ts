import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateManufacturingOrderDto {
  @IsInt()
  @Min(1)
  itemId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  bomId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  routingId?: number;
}
