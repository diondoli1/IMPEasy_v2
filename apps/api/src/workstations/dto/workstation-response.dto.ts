export class WorkstationResponseDto {
  id!: number;
  workstationGroupId!: number;
  code!: string | null;
  name!: string;
  type!: string | null;
  hourlyRate!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
