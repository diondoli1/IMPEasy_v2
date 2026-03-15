import { OrderStatusDashboardRowDto } from './order-status-dashboard-row.dto';
import { OrderStatusDashboardSummaryDto } from './order-status-dashboard-summary.dto';

export class OrderStatusDashboardResponseDto {
  summary!: OrderStatusDashboardSummaryDto;
  orders!: OrderStatusDashboardRowDto[];
}
