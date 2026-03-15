import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { InventoryItemResponseDto } from './dto/inventory-item-response.dto';
import { InventoryTransactionResponseDto } from './dto/inventory-transaction-response.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateMaterialIssueDto } from './dto/create-material-issue.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory-items')
@Roles('admin', 'planner')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles('admin', 'office', 'planner')
  listInventoryItems(): Promise<InventoryItemResponseDto[]> {
    return this.inventoryService.listInventoryItems();
  }

  @Get(':id')
  @Roles('admin', 'office', 'planner')
  findInventoryItem(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemResponseDto> {
    return this.inventoryService.findInventoryItem(id);
  }

  @Post()
  createInventoryItem(
    @Body() payload: CreateInventoryItemDto,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.createInventoryItem(payload);
  }

  @Get(':id/transactions')
  @Roles('admin', 'office', 'planner')
  listTransactions(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryTransactionResponseDto[]> {
    return this.inventoryService.listTransactions(id);
  }

  @Post(':id/issue')
  issueMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateMaterialIssueDto,
  ): Promise<InventoryTransactionResponseDto> {
    return this.inventoryService.issueMaterial(id, payload);
  }

  @Post(':id/adjust')
  adjustInventory(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateInventoryAdjustmentDto,
  ): Promise<InventoryTransactionResponseDto> {
    return this.inventoryService.adjustInventory(id, payload);
  }
}
