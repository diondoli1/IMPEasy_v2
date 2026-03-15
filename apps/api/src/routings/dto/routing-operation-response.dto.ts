export class RoutingOperationResponseDto {
  id!: number;
  routingId!: number;
  sequence!: number;
  name!: string;
  description!: string | null;
  workstation!: string | null;
  setupTimeMinutes!: number;
  runTimeMinutes!: number;
  queueNotes!: string | null;
  moveNotes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
