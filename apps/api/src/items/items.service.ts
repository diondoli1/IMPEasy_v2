import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { buildItemCode } from '../commercial-utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { UpdateItemDto } from './dto/update-item.dto';

const ITEM_INCLUDE = {
  defaultBom: {
    select: {
      id: true,
      name: true,
    },
  },
  defaultRouting: {
    select: {
      id: true,
      name: true,
    },
  },
  preferredVendor: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ItemInclude;

type ItemRecord = Prisma.ItemGetPayload<{
  include: typeof ITEM_INCLUDE;
}>;

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextCode(): Promise<string> {
    const result = await this.prisma.item.aggregate({
      _max: { id: true },
    });
    const nextId = (result._max.id ?? 0) + 1;
    return buildItemCode(nextId);
  }

  async findAll(): Promise<ItemResponseDto[]> {
    const items = await this.prisma.item.findMany({
      include: ITEM_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return items.map((item) => this.toItemResponse(item));
  }

  async findOne(id: number): Promise<ItemResponseDto> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: ITEM_INCLUDE,
    });

    if (!item) {
      throw new NotFoundException(`Item ${id} not found`);
    }

    return this.toItemResponse(item);
  }

  async create(payload: CreateItemDto): Promise<ItemResponseDto> {
    await this.assertLinkedRecords({
      defaultBomId: payload.defaultBomId,
      defaultRoutingId: payload.defaultRoutingId,
      preferredVendorId: payload.preferredVendorId,
    });

    const created = await this.prisma.item.create({
      data: {
        code: payload.code?.trim() || null,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        isActive: payload.isActive ?? true,
        itemGroup: payload.itemGroup?.trim() || null,
        unitOfMeasure: payload.unitOfMeasure?.trim() || 'pcs',
        itemType: payload.itemType ?? 'produced',
        defaultBomId: payload.defaultBomId ?? null,
        defaultRoutingId: payload.defaultRoutingId ?? null,
        defaultPrice: payload.defaultPrice ?? 0,
        reorderPoint: payload.reorderPoint ?? 0,
        safetyStock: payload.safetyStock ?? 0,
        preferredVendorId: payload.preferredVendorId ?? null,
        notes: payload.notes?.trim() || null,
      },
      include: ITEM_INCLUDE,
    });

    const quantityOnHand = payload.initialQuantityOnHand ?? 0;
    const inventoryItem = await this.prisma.inventoryItem.create({
      data: {
        itemId: created.id,
        quantityOnHand,
      },
    });

    if (quantityOnHand > 0) {
      await this.prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: inventoryItem.id,
          itemId: created.id,
          stockLotId: null,
          purchaseOrderLineId: null,
          transactionType: 'adjustment',
          quantity: quantityOnHand,
          notes: 'Initial quantity on item create',
        },
      });
    }

    return this.toItemResponse(created);
  }

  async update(id: number, payload: UpdateItemDto): Promise<ItemResponseDto> {
    await this.findOne(id);
    await this.assertLinkedRecords({
      defaultBomId: payload.defaultBomId ?? undefined,
      defaultRoutingId: payload.defaultRoutingId ?? undefined,
      preferredVendorId: payload.preferredVendorId ?? undefined,
    });

    const updated = await this.prisma.item.update({
      where: { id },
      data: {
        code: payload.code !== undefined ? payload.code.trim() || null : undefined,
        name: payload.name?.trim(),
        description:
          payload.description !== undefined ? payload.description.trim() || null : undefined,
        isActive: payload.isActive,
        itemGroup: payload.itemGroup !== undefined ? payload.itemGroup.trim() || null : undefined,
        unitOfMeasure:
          payload.unitOfMeasure !== undefined ? payload.unitOfMeasure.trim() || 'pcs' : undefined,
        itemType: payload.itemType,
        defaultBomId: payload.defaultBomId !== undefined ? payload.defaultBomId : undefined,
        defaultRoutingId:
          payload.defaultRoutingId !== undefined ? payload.defaultRoutingId : undefined,
        defaultPrice: payload.defaultPrice,
        reorderPoint: payload.reorderPoint,
        safetyStock: payload.safetyStock,
        preferredVendorId:
          payload.preferredVendorId !== undefined ? payload.preferredVendorId : undefined,
        notes: payload.notes !== undefined ? payload.notes.trim() || null : undefined,
      },
      include: ITEM_INCLUDE,
    });

    return this.toItemResponse(updated);
  }

  async setDefaultBom(itemId: number, bomId: number): Promise<ItemResponseDto> {
    await this.findOne(itemId);

    const bom = await this.prisma.bom.findUnique({
      where: { id: bomId },
      select: {
        id: true,
        itemId: true,
      },
    });

    if (!bom) {
      throw new NotFoundException(`BOM ${bomId} not found`);
    }

    if (bom.itemId !== itemId) {
      throw new NotFoundException(`BOM ${bomId} does not belong to item ${itemId}`);
    }

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        defaultBomId: bomId,
      },
      include: ITEM_INCLUDE,
    });

    return this.toItemResponse(updated);
  }

  async setDefaultRouting(itemId: number, routingId: number): Promise<ItemResponseDto> {
    await this.findOne(itemId);

    const routing = await this.prisma.routing.findUnique({
      where: { id: routingId },
      select: {
        id: true,
        itemId: true,
      },
    });

    if (!routing) {
      throw new NotFoundException(`Routing ${routingId} not found`);
    }

    if (routing.itemId !== itemId) {
      throw new NotFoundException(`Routing ${routingId} does not belong to item ${itemId}`);
    }

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        defaultRoutingId: routingId,
      },
      include: ITEM_INCLUDE,
    });

    return this.toItemResponse(updated);
  }

  private async assertLinkedRecords(input: {
    defaultBomId?: number;
    defaultRoutingId?: number;
    preferredVendorId?: number;
  }): Promise<void> {
    if (input.defaultBomId !== undefined && input.defaultBomId !== null) {
      const bom = await this.prisma.bom.findUnique({
        where: { id: input.defaultBomId },
        select: { id: true },
      });

      if (!bom) {
        throw new NotFoundException(`BOM ${input.defaultBomId} not found`);
      }
    }

    if (input.defaultRoutingId !== undefined && input.defaultRoutingId !== null) {
      const routing = await this.prisma.routing.findUnique({
        where: { id: input.defaultRoutingId },
        select: { id: true },
      });

      if (!routing) {
        throw new NotFoundException(`Routing ${input.defaultRoutingId} not found`);
      }
    }

    if (input.preferredVendorId !== undefined && input.preferredVendorId !== null) {
      const vendor = await this.prisma.supplier.findUnique({
        where: { id: input.preferredVendorId },
        select: { id: true },
      });

      if (!vendor) {
        throw new NotFoundException(`Supplier ${input.preferredVendorId} not found`);
      }
    }
  }

  private toItemResponse(item: ItemRecord): ItemResponseDto {
    return {
      id: item.id,
      code: item.code ?? buildItemCode(item.id),
      name: item.name,
      description: item.description ?? null,
      isActive: item.isActive,
      itemGroup: item.itemGroup ?? null,
      unitOfMeasure: item.unitOfMeasure ?? 'pcs',
      itemType: item.itemType,
      defaultBomId: item.defaultBomId ?? null,
      defaultBomName: item.defaultBom?.name ?? null,
      defaultRoutingId: item.defaultRoutingId ?? null,
      defaultRoutingName: item.defaultRouting?.name ?? null,
      defaultPrice: item.defaultPrice,
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      preferredVendorId: item.preferredVendorId ?? null,
      preferredVendorName: item.preferredVendor?.name ?? null,
      notes: item.notes ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
