import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoutingDto {
  @IsInt()
  @Min(1)
  itemId!: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
