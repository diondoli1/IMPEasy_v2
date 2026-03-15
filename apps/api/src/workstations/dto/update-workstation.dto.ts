import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWorkstationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  workstationGroupId?: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
