export class InspectionResponseDto {
  id!: number;
  operationId!: number;
  status!: string;
  notes!: string | null;
  passedQuantity!: number | null;
  failedQuantity!: number | null;
  reworkQuantity!: number | null;
  reworkOperationId!: number | null;
  reworkOperationStatus!: string | null;
  reworkOperationSequence!: number | null;
  reworkOperationPlannedQuantity!: number | null;
  reworkCreatedAt!: Date | null;
  scrappedQuantity!: number | null;
  scrapNotes!: string | null;
  scrappedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
