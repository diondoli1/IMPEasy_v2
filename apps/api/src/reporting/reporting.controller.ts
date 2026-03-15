import { Controller, Get } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { InventorySummaryReportResponseDto } from './dto/inventory-summary-report-response.dto';
import { ModuleDashboardResponseDto } from './dto/module-dashboard-response.dto';
import { OrderStatusDashboardResponseDto } from './dto/order-status-dashboard-response.dto';
import { ProductionPerformanceDashboardResponseDto } from './dto/production-performance-dashboard-response.dto';
import { SalesReportResponseDto } from './dto/sales-report-response.dto';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('order-status-dashboard')
  @Roles('admin', 'office')
  getOrderStatusDashboard(): Promise<OrderStatusDashboardResponseDto> {
    return this.reportingService.getOrderStatusDashboard();
  }

  @Get('production-performance-dashboard')
  @Roles('admin', 'planner')
  getProductionPerformanceDashboard(): Promise<ProductionPerformanceDashboardResponseDto> {
    return this.reportingService.getProductionPerformanceDashboard();
  }

  @Get('inventory-summary')
  @Roles('admin', 'office', 'planner')
  getInventorySummaryReport(): Promise<InventorySummaryReportResponseDto> {
    return this.reportingService.getInventorySummaryReport();
  }

  @Get('sales-report')
  @Roles('admin', 'office')
  getSalesReport(): Promise<SalesReportResponseDto> {
    return this.reportingService.getSalesReport();
  }

  @Get('dashboards/customer-orders')
  @Roles('admin', 'office')
  getCustomerOrdersDashboard(): Promise<ModuleDashboardResponseDto> {
    return this.reportingService.getCustomerOrdersDashboard();
  }

  @Get('dashboards/production')
  @Roles('admin', 'planner')
  getProductionDashboard(): Promise<ModuleDashboardResponseDto> {
    return this.reportingService.getProductionDashboard();
  }

  @Get('dashboards/inventory')
  @Roles('admin', 'office', 'planner')
  getInventoryDashboard(): Promise<ModuleDashboardResponseDto> {
    return this.reportingService.getInventoryDashboard();
  }

  @Get('dashboards/purchasing')
  @Roles('admin', 'office')
  getPurchasingDashboard(): Promise<ModuleDashboardResponseDto> {
    return this.reportingService.getPurchasingDashboard();
  }
}
