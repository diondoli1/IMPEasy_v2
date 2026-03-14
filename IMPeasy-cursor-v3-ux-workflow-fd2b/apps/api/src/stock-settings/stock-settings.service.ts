import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import type { ProductGroupResponseDto } from './dto/product-group-response.dto';
import type { UnitOfMeasureResponseDto } from './dto/unit-of-measure-response.dto';

@Injectable()
export class StockSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProductGroups(): Promise<ProductGroupResponseDto[]> {
    const groups = await this.prisma.productGroup.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return groups.map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
  }

  async createProductGroup(payload: CreateProductGroupDto): Promise<ProductGroupResponseDto> {
    const code = `AG${String(Date.now()).slice(-6)}`;
    const existing = await this.prisma.productGroup.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException('Product group code collision');
    }
    const created = await this.prisma.productGroup.create({
      data: {
        code,
        name: payload.name.trim(),
      },
    });
    return {
      id: created.id,
      code: created.code,
      name: created.name,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async listUnitOfMeasures(): Promise<UnitOfMeasureResponseDto[]> {
    const units = await this.prisma.unitOfMeasure.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return units.map((u) => ({
      id: u.id,
      name: u.name,
      baseUnit: u.baseUnit,
      conversionRate: u.conversionRate,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  async createUnitOfMeasure(payload: CreateUnitOfMeasureDto): Promise<UnitOfMeasureResponseDto> {
    const name = payload.name.trim();
    const existing = await this.prisma.unitOfMeasure.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException(`Unit of measure "${name}" already exists`);
    }
    const created = await this.prisma.unitOfMeasure.create({
      data: {
        name,
        baseUnit: payload.baseUnit?.trim() || null,
        conversionRate: payload.conversionRate ?? 1,
      },
    });
    return {
      id: created.id,
      name: created.name,
      baseUnit: created.baseUnit,
      conversionRate: created.conversionRate,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }
}
