import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRoutingOperationDto } from './dto/create-routing-operation.dto';
import { CreateRoutingDto } from './dto/create-routing.dto';
import { RoutingLinkResponseDto } from './dto/routing-link-response.dto';
import { RoutingOperationResponseDto } from './dto/routing-operation-response.dto';
import { RoutingResponseDto } from './dto/routing-response.dto';
import { UpdateRoutingOperationDto } from './dto/update-routing-operation.dto';
import { UpdateRoutingDto } from './dto/update-routing.dto';
import { RoutingsService } from './routings.service';

@Controller('routings')
@Roles('admin', 'planner')
export class RoutingsController {
  constructor(private readonly routingsService: RoutingsService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RoutingResponseDto> {
    return this.routingsService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateRoutingDto): Promise<RoutingResponseDto> {
    return this.routingsService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateRoutingDto,
  ): Promise<RoutingResponseDto> {
    return this.routingsService.update(id, payload);
  }

  @Get('item/:itemId')
  listByItem(@Param('itemId', ParseIntPipe) itemId: number): Promise<RoutingResponseDto[]> {
    return this.routingsService.listByItem(itemId);
  }

  @Get(':routingId/operations')
  listRoutingOperations(
    @Param('routingId', ParseIntPipe) routingId: number,
  ): Promise<RoutingOperationResponseDto[]> {
    return this.routingsService.listRoutingOperations(routingId);
  }

  @Post(':routingId/operations')
  createRoutingOperation(
    @Param('routingId', ParseIntPipe) routingId: number,
    @Body() payload: CreateRoutingOperationDto,
  ): Promise<RoutingOperationResponseDto> {
    return this.routingsService.createRoutingOperation(routingId, payload);
  }

  @Patch(':routingId/operations/:operationId')
  updateRoutingOperation(
    @Param('routingId', ParseIntPipe) routingId: number,
    @Param('operationId', ParseIntPipe) operationId: number,
    @Body() payload: UpdateRoutingOperationDto,
  ): Promise<RoutingOperationResponseDto> {
    return this.routingsService.updateRoutingOperation(routingId, operationId, payload);
  }

  @Patch(':id/default')
  setAsDefault(@Param('id', ParseIntPipe) id: number): Promise<RoutingLinkResponseDto> {
    return this.routingsService.setAsDefault(id);
  }
}
