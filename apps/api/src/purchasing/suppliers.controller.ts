import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateItemVendorTermDto } from './dto/create-item-vendor-term.dto';
import { ItemVendorTermResponseDto } from './dto/item-vendor-term-response.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierDetailResponseDto } from './dto/supplier-detail-response.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { UpdateItemVendorTermDto } from './dto/update-item-vendor-term.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@Roles('admin', 'office')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(): Promise<SupplierResponseDto[]> {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SupplierDetailResponseDto> {
    return this.suppliersService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateSupplierDto): Promise<SupplierResponseDto> {
    return this.suppliersService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.update(id, payload);
  }

  @Get(':id/item-terms')
  listItemVendorTerms(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemVendorTermResponseDto[]> {
    return this.suppliersService.listItemVendorTermsBySupplier(id);
  }

  @Post(':id/item-terms')
  createItemVendorTerm(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateItemVendorTermDto,
  ): Promise<ItemVendorTermResponseDto> {
    return this.suppliersService.createItemVendorTerm(id, payload);
  }

  @Patch(':id/item-terms/:termId')
  updateItemVendorTerm(
    @Param('id', ParseIntPipe) id: number,
    @Param('termId', ParseIntPipe) termId: number,
    @Body() payload: UpdateItemVendorTermDto,
  ): Promise<ItemVendorTermResponseDto> {
    return this.suppliersService.updateItemVendorTerm(id, termId, payload);
  }
}
