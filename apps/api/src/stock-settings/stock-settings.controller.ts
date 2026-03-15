import { Body, Controller, Get, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import type { ProductGroupResponseDto } from './dto/product-group-response.dto';
import type { UnitOfMeasureResponseDto } from './dto/unit-of-measure-response.dto';
import { StockSettingsService } from './stock-settings.service';

@Controller('stock-settings')
@Roles('admin', 'office')
export class StockSettingsController {
  constructor(private readonly stockSettingsService: StockSettingsService) {}

  @Get('product-groups')
  listProductGroups(): Promise<ProductGroupResponseDto[]> {
    return this.stockSettingsService.listProductGroups();
  }

  @Post('product-groups')
  createProductGroup(
    @Body() payload: CreateProductGroupDto,
  ): Promise<ProductGroupResponseDto> {
    return this.stockSettingsService.createProductGroup(payload);
  }

  @Get('unit-of-measures')
  listUnitOfMeasures(): Promise<UnitOfMeasureResponseDto[]> {
    return this.stockSettingsService.listUnitOfMeasures();
  }

  @Post('unit-of-measures')
  createUnitOfMeasure(
    @Body() payload: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureResponseDto> {
    return this.stockSettingsService.createUnitOfMeasure(payload);
  }
}
