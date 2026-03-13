import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CompleteOperationDto } from './dto/complete-operation.dto';
import { CreateProductionLogDto } from './dto/create-production-log.dto';
import { OperationDetailResponseDto } from './dto/operation-detail-response.dto';
import { OperationQueueResponseDto } from './dto/operation-queue-response.dto';
import { ProductionLogResponseDto } from './dto/production-log-response.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('operations')
@Roles('admin', 'planner', 'operator')
export class OperationsController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get('queue')
  listQueue(): Promise<OperationQueueResponseDto[]> {
    return this.workOrdersService.listOperationQueue();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OperationDetailResponseDto> {
    return this.workOrdersService.findOperationOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'planner')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateOperationDto,
  ): Promise<OperationDetailResponseDto> {
    return this.workOrdersService.updateOperation(id, payload);
  }

  @Get(':id/logs')
  listProductionLogs(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductionLogResponseDto[]> {
    return this.workOrdersService.listProductionLogs(id);
  }

  @Post(':id/logs')
  @Roles('admin', 'operator')
  createProductionLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateProductionLogDto,
  ): Promise<ProductionLogResponseDto> {
    return this.workOrdersService.createProductionLog(id, payload);
  }

  @Post(':id/start')
  @Roles('admin', 'operator')
  start(@Param('id', ParseIntPipe) id: number): Promise<OperationDetailResponseDto> {
    return this.workOrdersService.startOperation(id);
  }

  @Post(':id/pause')
  @Roles('admin', 'operator')
  pause(@Param('id', ParseIntPipe) id: number): Promise<OperationDetailResponseDto> {
    return this.workOrdersService.pauseOperation(id);
  }

  @Post(':id/complete')
  @Roles('admin', 'operator')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CompleteOperationDto,
  ): Promise<OperationDetailResponseDto> {
    return this.workOrdersService.completeOperation(id, payload);
  }
}
