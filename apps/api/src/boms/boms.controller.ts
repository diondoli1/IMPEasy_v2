import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { BomItemResponseDto } from './dto/bom-item-response.dto';
import { BomLinkResponseDto } from './dto/bom-link-response.dto';
import { BomResponseDto } from './dto/bom-response.dto';
import { CreateBomItemDto } from './dto/create-bom-item.dto';
import { CreateBomDto } from './dto/create-bom.dto';
import { UpdateBomItemDto } from './dto/update-bom-item.dto';
import { UpdateBomDto } from './dto/update-bom.dto';
import { BomsService } from './boms.service';

@Controller('boms')
@Roles('admin', 'planner')
export class BomsController {
  constructor(private readonly bomsService: BomsService) {}

  @Get('item/:itemId')
  listByItem(@Param('itemId', ParseIntPipe) itemId: number): Promise<BomResponseDto[]> {
    return this.bomsService.listByItem(itemId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BomResponseDto> {
    return this.bomsService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateBomDto): Promise<BomResponseDto> {
    return this.bomsService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateBomDto,
  ): Promise<BomResponseDto> {
    return this.bomsService.update(id, payload);
  }

  @Patch(':id/default')
  setAsDefault(@Param('id', ParseIntPipe) id: number): Promise<BomLinkResponseDto> {
    return this.bomsService.setAsDefault(id);
  }

  @Get(':bomId/items')
  listBomItems(
    @Param('bomId', ParseIntPipe) bomId: number,
  ): Promise<BomItemResponseDto[]> {
    return this.bomsService.listBomItems(bomId);
  }

  @Post(':bomId/items')
  createBomItem(
    @Param('bomId', ParseIntPipe) bomId: number,
    @Body() payload: CreateBomItemDto,
  ): Promise<BomItemResponseDto> {
    return this.bomsService.createBomItem(bomId, payload);
  }

  @Patch(':bomId/items/:bomItemId')
  updateBomItem(
    @Param('bomId', ParseIntPipe) bomId: number,
    @Param('bomItemId', ParseIntPipe) bomItemId: number,
    @Body() payload: UpdateBomItemDto,
  ): Promise<BomItemResponseDto> {
    return this.bomsService.updateBomItem(bomId, bomItemId, payload);
  }
}
