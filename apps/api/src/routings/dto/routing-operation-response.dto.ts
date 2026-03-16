export class RoutingOperationResponseDto {
  id!: number;
  routingId!: number;
  sequence!: number;
  name!: string;
  description!: string | null;
  workstation!: string | null;
  workstationGroupId!: number | null;
  workstationGroupName!: string | null;
  setupTimeMinutes!: number;
  runTimeMinutes!: number;
  cost!: number | null;
  queueNotes!: string | null;
  moveNotes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
