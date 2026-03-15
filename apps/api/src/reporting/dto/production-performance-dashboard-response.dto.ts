import { ProductionPerformanceDashboardRowDto } from './production-performance-dashboard-row.dto';
import { ProductionPerformanceDashboardSummaryDto } from './production-performance-dashboard-summary.dto';

export class ProductionPerformanceDashboardResponseDto {
  summary!: ProductionPerformanceDashboardSummaryDto;
  workOrders!: ProductionPerformanceDashboardRowDto[];
}
