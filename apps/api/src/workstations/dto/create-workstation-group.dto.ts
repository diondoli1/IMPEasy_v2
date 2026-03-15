import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkstationGroupDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  instanceCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
