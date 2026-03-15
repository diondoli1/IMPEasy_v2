import { SalesReportRowDto } from './sales-report-row.dto';
import { SalesReportSummaryDto } from './sales-report-summary.dto';

export class SalesReportResponseDto {
  summary!: SalesReportSummaryDto;
  orders!: SalesReportRowDto[];
}
