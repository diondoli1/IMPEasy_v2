import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentDetailResponseDto } from './dto/shipment-detail-response.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpsertShipmentPicksDto } from './dto/upsert-shipment-picks.dto';
import { ShippingService } from './shipping.service';

@Controller('shipments')
@Roles('admin', 'office')
export class ShipmentsController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  list(): Promise<ShipmentResponseDto[]> {
    return this.shippingService.listAll();
  }

  @Get(':shipmentId')
  findOne(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<ShipmentDetailResponseDto> {
    return this.shippingService.findOne(shipmentId);
  }

  @Post()
  create(@Body() payload: CreateShipmentDto): Promise<ShipmentResponseDto> {
    return this.shippingService.create(payload);
  }

  @Patch(':shipmentId')
  @HttpCode(200)
  update(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
    @Body() payload: UpdateShipmentDto,
  ): Promise<ShipmentDetailResponseDto> {
    return this.shippingService.update(shipmentId, payload);
  }

  @Post(':shipmentId/picks')
  @HttpCode(200)
  upsertPicks(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
    @Body() payload: UpsertShipmentPicksDto,
  ): Promise<ShipmentDetailResponseDto> {
    return this.shippingService.upsertPicks(shipmentId, payload);
  }

  @Post(':shipmentId/pick')
  @HttpCode(200)
  pick(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<ShipmentResponseDto> {
    return this.shippingService.pick(shipmentId);
  }

  @Post(':shipmentId/pack')
  @HttpCode(200)
  packAlias(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<ShipmentResponseDto> {
    return this.shippingService.pick(shipmentId);
  }

  @Post(':shipmentId/ship')
  @HttpCode(200)
  ship(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<ShipmentResponseDto> {
    return this.shippingService.ship(shipmentId);
  }

  @Post(':shipmentId/deliver')
  @HttpCode(200)
  deliver(
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
  ): Promise<ShipmentResponseDto> {
    return this.shippingService.deliver(shipmentId);
  }
}
