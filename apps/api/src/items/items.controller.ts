import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemsService } from './items.service';

@Controller(['items', 'manufactured-items'])
@Roles('admin', 'planner')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @Roles('admin', 'office', 'planner')
  findAll(): Promise<ItemResponseDto[]> {
    return this.itemsService.findAll();
  }

  @Get('next-code')
  @Roles('admin', 'office', 'planner')
  getNextCode(): Promise<string> {
    return this.itemsService.getNextCode();
  }

  @Get(':id')
  @Roles('admin', 'office', 'planner')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ItemResponseDto> {
    return this.itemsService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateItemDto): Promise<ItemResponseDto> {
    return this.itemsService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    return this.itemsService.update(id, payload);
  }
}
