import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CriticalOnHandResponseDto } from './dto/critical-on-hand-response.dto';
import { StockItemDetailResponseDto } from './dto/stock-item-detail-response.dto';
import { StockItemResponseDto } from './dto/stock-item-response.dto';
import { StockLotDetailResponseDto } from './dto/stock-lot-detail-response.dto';
import { StockLotResponseDto } from './dto/stock-lot-response.dto';
import { StockMovementResponseDto } from './dto/stock-movement-response.dto';
import { InventoryService } from './inventory.service';

@Controller('stock')
@Roles('admin', 'office', 'planner')
export class StockController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  listStockItems(): Promise<StockItemResponseDto[]> {
    return this.inventoryService.listStockItems();
  }

  @Get('items/:id')
  findStockItem(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StockItemDetailResponseDto> {
    return this.inventoryService.findStockItem(id);
  }

  @Get('lots')
  listStockLots(): Promise<StockLotResponseDto[]> {
    return this.inventoryService.listStockLots();
  }

  @Get('lots/:id')
  findStockLot(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StockLotDetailResponseDto> {
    return this.inventoryService.findStockLot(id);
  }

  @Get('movements')
  listStockMovements(): Promise<StockMovementResponseDto[]> {
    return this.inventoryService.listStockMovements();
  }

  @Get('critical-on-hand')
  listCriticalOnHand(): Promise<CriticalOnHandResponseDto[]> {
    return this.inventoryService.listCriticalOnHand();
  }
}
