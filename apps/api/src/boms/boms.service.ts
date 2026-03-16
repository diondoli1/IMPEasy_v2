import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { buildItemCode } from '../commercial-utils';
import { ItemsService } from '../items/items.service';
import { PrismaService } from '../prisma/prisma.service';
import { BomItemResponseDto } from './dto/bom-item-response.dto';
import { BomLinkResponseDto } from './dto/bom-link-response.dto';
import { BomResponseDto } from './dto/bom-response.dto';
import { CreateBomItemDto } from './dto/create-bom-item.dto';
import { CreateBomDto } from './dto/create-bom.dto';
import { UpdateBomItemDto } from './dto/update-bom-item.dto';
import { UpdateBomDto } from './dto/update-bom.dto';

const BOM_DETAIL_INCLUDE = {
  item: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  bomItems: {
    include: {
      item: {
        select: {
          id: true,
          code: true,
          name: true,
          itemGroup: true,
          unitOfMeasure: true,
          defaultPrice: true,
        },
      },
    },
    orderBy: [{ rowOrder: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.BomInclude;

type BomRecord = Prisma.BomGetPayload<{
  include: typeof BOM_DETAIL_INCLUDE;
}>;

type BomItemRecord = Prisma.BomItemGetPayload<{
  include: typeof BOM_DETAIL_INCLUDE.bomItems.include;
}>;

@Injectable()
export class BomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemsService: ItemsService,
  ) {}

  async listByItem(itemId: number): Promise<BomResponseDto[]> {
    await this.itemsService.findOne(itemId);

    const boms = await this.prisma.bom.findMany({
      where: { itemId },
      include: BOM_DETAIL_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return boms.map((bom) => this.toBomResponse(bom));
  }

  async findOne(id: number): Promise<BomResponseDto> {
    const bom = await this.getBomOrThrow(id);
    return this.toBomResponse(bom);
  }

  async create(payload: CreateBomDto): Promise<BomResponseDto> {
    await this.itemsService.findOne(payload.itemId);

    const created = await this.prisma.bom.create({
      data: {
        itemId: payload.itemId,
        code: payload.code?.trim() || null,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        status: payload.status?.trim() || 'draft',
        notes: payload.notes?.trim() || null,
      },
      include: BOM_DETAIL_INCLUDE,
    });

    return this.findOne(created.id);
  }

  async update(id: number, payload: UpdateBomDto): Promise<BomResponseDto> {
    await this.getBomOrThrow(id);

    const updated = await this.prisma.bom.update({
      where: { id },
      data: {
        code: payload.code !== undefined ? payload.code.trim() || null : undefined,
        name: payload.name?.trim(),
        description: payload.description !== undefined ? payload.description.trim() || null : undefined,
        status: payload.status !== undefined ? payload.status.trim() || 'draft' : undefined,
        notes: payload.notes !== undefined ? payload.notes.trim() || null : undefined,
      },
      include: BOM_DETAIL_INCLUDE,
    });

    return this.findOne(updated.id);
  }

  async setAsDefault(bomId: number): Promise<BomLinkResponseDto> {
    const bom = await this.getBomOrThrow(bomId);
    const updatedItem = await this.itemsService.setDefaultBom(bom.itemId, bom.id);

    return {
      itemId: updatedItem.id,
      bomId: bom.id,
    };
  }

  async listBomItems(bomId: number): Promise<BomItemResponseDto[]> {
    await this.ensureBomExists(bomId);

    const bomItems = await this.prisma.bomItem.findMany({
      where: { bomId },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            unitOfMeasure: true,
            defaultPrice: true,
          },
        },
      },
      orderBy: [{ rowOrder: 'asc' }, { id: 'asc' }],
    });

    return bomItems.map((bomItem) => this.toBomItemResponse(bomItem));
  }

  async createBomItem(bomId: number, payload: CreateBomItemDto): Promise<BomItemResponseDto> {
    await this.ensureBomExists(bomId);
    await this.itemsService.findOne(payload.itemId);

    const existingRows = await this.prisma.bomItem.findMany({
      where: { bomId },
      select: {
        rowOrder: true,
      },
    });
    const maxRow = existingRows.reduce((max, row) => Math.max(max, row.rowOrder), 0);

    const created = await this.prisma.bomItem.create({
      data: {
        bomId,
        itemId: payload.itemId,
        quantity: payload.quantity,
        rowOrder: payload.rowOrder ?? maxRow + 10,
        notes: payload.notes?.trim() || null,
        approximateCost: payload.approximateCost ?? null,
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            itemGroup: true,
            unitOfMeasure: true,
            defaultPrice: true,
          },
        },
      },
    });

    return this.toBomItemResponse(created);
  }

  async updateBomItem(
    bomId: number,
    bomItemId: number,
    payload: UpdateBomItemDto,
  ): Promise<BomItemResponseDto> {
    await this.ensureBomExists(bomId);

    const existing = await this.prisma.bomItem.findUnique({
      where: { id: bomItemId },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            itemGroup: true,
            unitOfMeasure: true,
            defaultPrice: true,
          },
        },
      },
    });

    if (!existing || existing.bomId !== bomId) {
      throw new NotFoundException(`BOM item ${bomItemId} not found for BOM ${bomId}`);
    }

    if (payload.itemId !== undefined) {
      await this.itemsService.findOne(payload.itemId);
    }

    const updated = await this.prisma.bomItem.update({
      where: { id: bomItemId },
      data: {
        itemId: payload.itemId,
        quantity: payload.quantity,
        rowOrder: payload.rowOrder,
        notes: payload.notes !== undefined ? payload.notes.trim() || null : undefined,
        approximateCost: payload.approximateCost !== undefined ? payload.approximateCost : undefined,
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            itemGroup: true,
            unitOfMeasure: true,
            defaultPrice: true,
          },
        },
      },
    });

    return this.toBomItemResponse(updated);
  }

  private async getBomOrThrow(id: number): Promise<BomRecord> {
    const bom = await this.prisma.bom.findUnique({
      where: { id },
      include: BOM_DETAIL_INCLUDE,
    });

    if (!bom) {
      throw new NotFoundException(`BOM ${id} not found`);
    }

    return bom;
  }

  private async ensureBomExists(bomId: number): Promise<void> {
    const bom = await this.prisma.bom.findUnique({ where: { id: bomId } });

    if (!bom) {
      throw new NotFoundException(`BOM ${bomId} not found`);
    }
  }

  private toBomResponse(bom: BomRecord): BomResponseDto {
    const roughCost = (bom.bomItems ?? []).reduce((sum, bomItem) => {
      return sum + bomItem.quantity * (bomItem.item.defaultPrice ?? 0);
    }, 0);
    const itemCode = bom.item?.code ?? buildItemCode(bom.itemId);
    const itemName = bom.item?.name ?? `Item ${bom.itemId}`;

    return {
      id: bom.id,
      itemId: bom.itemId,
      itemCode,
      itemName,
      code: bom.code ?? `BOM-${String(bom.id).padStart(4, '0')}`,
      name: bom.name,
      description: bom.description ?? null,
      status: bom.status,
      notes: bom.notes ?? null,
      roughCost,
      createdAt: bom.createdAt,
      updatedAt: bom.updatedAt,
    };
  }

  private toBomItemResponse(bomItem: BomItemRecord): BomItemResponseDto {
    const defaultPrice = bomItem.item?.defaultPrice ?? 0;
    const itemCode = bomItem.item?.code ?? buildItemCode(bomItem.itemId);
    const itemName = bomItem.item?.name ?? `Item ${bomItem.itemId}`;
    const unitOfMeasure = bomItem.item?.unitOfMeasure ?? 'pcs';
    const itemGroup = bomItem.item?.itemGroup ?? null;

    return {
      id: bomItem.id,
      bomId: bomItem.bomId,
      rowOrder: bomItem.rowOrder,
      itemId: bomItem.itemId,
      itemCode,
      itemName,
      itemGroup,
      unitOfMeasure,
      quantity: bomItem.quantity,
      notes: bomItem.notes ?? null,
      approximateCost: bomItem.approximateCost ?? null,
      defaultPrice,
      lineCost: defaultPrice * bomItem.quantity,
      createdAt: bomItem.createdAt,
      updatedAt: bomItem.updatedAt,
    };
  }
}
