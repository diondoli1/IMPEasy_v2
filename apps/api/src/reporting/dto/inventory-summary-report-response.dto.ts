import { InventorySummaryReportRowDto } from './inventory-summary-report-row.dto';
import { InventorySummaryReportSummaryDto } from './inventory-summary-report-summary.dto';

export class InventorySummaryReportResponseDto {
  summary!: InventorySummaryReportSummaryDto;
  items!: InventorySummaryReportRowDto[];
}
