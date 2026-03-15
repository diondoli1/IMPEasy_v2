import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  assignedOperatorId?: number;

  @IsOptional()
  @IsString()
  assignedWorkstation?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
