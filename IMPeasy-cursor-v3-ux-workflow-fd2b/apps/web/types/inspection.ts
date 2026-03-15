export type Inspection = {
  id: number;
  operationId: number;
  status: string;
  notes: string | null;
  passedQuantity: number | null;
  failedQuantity: number | null;
  reworkQuantity: number | null;
  reworkOperationId?: number | null;
  reworkOperationStatus?: string | null;
  reworkOperationSequence?: number | null;
  reworkOperationPlannedQuantity?: number | null;
  reworkCreatedAt?: string | null;
  scrappedQuantity: number | null;
  scrapNotes: string | null;
  scrappedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InspectionInput = {
  notes?: string;
};

export type InspectionResultInput = {
  status: 'passed' | 'failed';
  passedQuantity: number;
  failedQuantity: number;
  reworkQuantity: number;
  notes?: string;
};

export type InspectionScrapInput = {
  notes?: string;
};
