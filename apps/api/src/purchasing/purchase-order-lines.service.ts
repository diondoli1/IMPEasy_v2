import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { PurchaseOrderLine as PurchaseOrderLineModel } from '@prisma/client';

import { InventoryService } from '../inventory/inventory.service';
import { ItemsService } from '../items/items.service';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService } from '../settings/numbering.service';
import { CreatePurchaseOrderLineDto } from './dto/create-purchase-order-line.dto';
import { PurchaseOrderLineResponseDto } from './dto/purchase-order-line-response.dto';
import { ReceivePurchaseOrderLineDto } from './dto/receive-purchase-order-line.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@Injectable()
export class PurchaseOrderLinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly itemsService: ItemsService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly numberingService: NumberingService,
  ) {}

  async listByPurchaseOrder(purchaseOrderId: number): Promise<PurchaseOrderLineResponseDto[]> {
    await this.purchaseOrdersService.findOne(purchaseOrderId);

    const lines = await this.prisma.purchaseOrderLine.findMany({
      where: { purchaseOrderId },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return this.toResponses(lines);
  }

  async create(
    purchaseOrderId: number,
    payload: CreatePurchaseOrderLineDto,
  ): Promise<PurchaseOrderLineResponseDto> {
    await this.purchaseOrdersService.findOne(purchaseOrderId);
    await this.itemsService.findOne(payload.itemId);

    const line = await this.prisma.purchaseOrderLine.create({
      data: {
        purchaseOrderId,
        itemId: payload.itemId,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        lineTotal: payload.quantity * payload.unitPrice,
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    await this.purchaseOrdersService.refreshStatus(purchaseOrderId);

    return this.toResponse(line, 0);
  }

  async receive(
    purchaseOrderId: number,
    lineId: number,
    payload: ReceivePurchaseOrderLineDto,
  ): Promise<PurchaseOrderLineResponseDto> {
    const purchaseOrder = await this.purchaseOrdersService.findOne(purchaseOrderId);
    const numberingSnapshot = await this.numberingService.getSnapshot();

    const line = await this.prisma.purchaseOrderLine.findUnique({
      where: { id: lineId },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!line) {
      throw new NotFoundException(`Purchase order line ${lineId} not found`);
    }

    if (line.purchaseOrderId !== purchaseOrderId) {
      throw new BadRequestException(
        `Purchase order line ${lineId} does not belong to purchase order ${purchaseOrderId}`,
      );
    }

    const receivedQuantities =
      await this.inventoryService.getReceivedQuantitiesByPurchaseOrderLineIds([lineId]);
    const currentReceived = receivedQuantities.get(lineId) ?? 0;
    const nextReceived = currentReceived + payload.quantity;

    if (nextReceived > line.quantity) {
      throw new BadRequestException(
        `Receive quantity exceeds remaining quantity for purchase order line ${lineId}. Remaining: ${line.quantity - currentReceived}, requested: ${payload.quantity}`,
      );
    }

    await this.inventoryService.receivePurchaseOrderLine({
      itemId: line.itemId,
      purchaseOrderLineId: line.id,
      quantity: payload.quantity,
      existingLotId: payload.existingLotId,
      lotNumber: payload.lotNumber,
      receiptDate: payload.receiptDate ? new Date(payload.receiptDate) : new Date(),
      referenceNumber:
        purchaseOrder.number ??
        this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'purchase_orders',
          purchaseOrder.id,
        ),
      notes: payload.notes,
    });

    await this.purchaseOrdersService.refreshStatus(purchaseOrderId);

    return this.toResponse(line, nextReceived);
  }

  private async toResponses(
    lines: Array<
      PurchaseOrderLineModel & {
        item: {
          code: string | null;
          name: string;
        };
      }
    >,
  ): Promise<PurchaseOrderLineResponseDto[]> {
    const receivedQuantities = await this.inventoryService.getReceivedQuantitiesByPurchaseOrderLineIds(
      lines.map((line) => line.id),
    );

    return lines.map((line) => this.toResponse(line, receivedQuantities.get(line.id) ?? 0));
  }

  private toResponse(
    line: PurchaseOrderLineModel & {
      item: {
        code: string | null;
        name: string;
      };
    },
    receivedQuantity: number,
  ): PurchaseOrderLineResponseDto {
    return {
      id: line.id,
      purchaseOrderId: line.purchaseOrderId,
      itemId: line.itemId,
      itemCode: line.item.code,
      itemName: line.item.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      receivedQuantity,
      remainingQuantity: Math.max(line.quantity - receivedQuantity, 0),
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
    };
  }
}
