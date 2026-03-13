import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { RecordInspectionResultDto } from './dto/record-inspection-result.dto';
import { RecordInspectionScrapDto } from './dto/record-inspection-scrap.dto';
import { InspectionsService } from './inspections.service';

@Controller('operations/:operationId/inspection')
@Roles('admin', 'planner')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  findByOperation(
    @Param('operationId', ParseIntPipe) operationId: number,
  ): Promise<InspectionResponseDto> {
    return this.inspectionsService.findByOperation(operationId);
  }

  @Post()
  createForOperation(
    @Param('operationId', ParseIntPipe) operationId: number,
    @Body() payload: CreateInspectionDto,
  ): Promise<InspectionResponseDto> {
    return this.inspectionsService.createForOperation(operationId, payload);
  }

  @Patch('result')
  recordResult(
    @Param('operationId', ParseIntPipe) operationId: number,
    @Body() payload: RecordInspectionResultDto,
  ): Promise<InspectionResponseDto> {
    return this.inspectionsService.recordResult(operationId, payload);
  }

  @Post('rework')
  createReworkOperation(
    @Param('operationId', ParseIntPipe) operationId: number,
  ): Promise<InspectionResponseDto> {
    return this.inspectionsService.createReworkOperation(operationId);
  }

  @Post('scrap')
  recordScrap(
    @Param('operationId', ParseIntPipe) operationId: number,
    @Body() payload: RecordInspectionScrapDto,
  ): Promise<InspectionResponseDto> {
    return this.inspectionsService.recordScrap(operationId, payload);
  }
}
