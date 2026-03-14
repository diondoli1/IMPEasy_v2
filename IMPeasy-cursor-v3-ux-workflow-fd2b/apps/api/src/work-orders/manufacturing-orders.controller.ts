import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateManufacturingOrderDto } from './dto/create-manufacturing-order.dto';
import { UpdateMaterialBookingDto } from './dto/update-material-booking.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpsertMaterialBookingDto } from './dto/upsert-material-booking.dto';
import { WorkOrderDetailResponseDto } from './dto/work-order-detail-response.dto';
import { WorkOrderResponseDto } from './dto/work-order-response.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('manufacturing-orders')
@Roles('admin', 'planner')
export class ManufacturingOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  listAll(): Promise<WorkOrderResponseDto[]> {
    return this.workOrdersService.listAll();
  }

  @Post()
  createDirect(@Body() payload: CreateManufacturingOrderDto): Promise<WorkOrderResponseDto> {
    return this.workOrdersService.createDirect({
      itemId: payload.itemId,
      quantity: payload.quantity,
      dueDate: payload.dueDate,
      bomId: payload.bomId,
      routingId: payload.routingId,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkOrderDetailResponseDto> {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateWorkOrderDto,
  ): Promise<WorkOrderDetailResponseDto> {
    return this.workOrdersService.update(id, payload);
  }

  @Post(':id/release')
  release(@Param('id', ParseIntPipe) id: number): Promise<WorkOrderDetailResponseDto> {
    return this.workOrdersService.releaseWorkOrder(id);
  }

  @Post(':id/bookings')
  createOrUpdateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpsertMaterialBookingDto,
  ): Promise<WorkOrderDetailResponseDto> {
    return this.workOrdersService.upsertMaterialBooking(id, payload);
  }

  @Patch(':id/bookings/:bookingId')
  updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() payload: UpdateMaterialBookingDto,
  ): Promise<WorkOrderDetailResponseDto> {
    return this.workOrdersService.updateMaterialBooking(id, bookingId, payload);
  }
}
