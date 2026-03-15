import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoutingOperationDto {
  @IsInt()
  @Min(1)
  sequence!: number;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  workstation?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  setupTimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  runTimeMinutes?: number;

  @IsOptional()
  @IsString()
  queueNotes?: string;

  @IsOptional()
  @IsString()
  moveNotes?: string;
}
