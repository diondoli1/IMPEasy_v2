import { MaterialRequirementResponseDto } from './material-requirement-response.dto';
import { OperationSummaryResponseDto } from './operation-summary-response.dto';
import { WorkOrderHistoryResponseDto } from './work-order-history-response.dto';
import { WorkOrderResponseDto } from './work-order-response.dto';

export class WorkOrderDetailResponseDto extends WorkOrderResponseDto {
  notes!: string | null;
  producedQuantity!: number;
  scrapQuantity!: number;
  finishedGoodsLotId!: number | null;
  materials!: MaterialRequirementResponseDto[];
  operations!: OperationSummaryResponseDto[];
  history!: WorkOrderHistoryResponseDto[];
}
