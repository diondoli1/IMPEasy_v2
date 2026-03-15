export class WorkstationGroupResponseDto {
  id!: number;
  code!: string | null;
  name!: string;
  type!: string | null;
  instanceCount!: number;
  hourlyRate!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
