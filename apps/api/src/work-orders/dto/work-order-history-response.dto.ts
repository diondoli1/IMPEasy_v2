export class WorkOrderHistoryResponseDto {
  id!: number;
  eventType!: string;
  actor!: string;
  message!: string;
  createdAt!: Date;
}
