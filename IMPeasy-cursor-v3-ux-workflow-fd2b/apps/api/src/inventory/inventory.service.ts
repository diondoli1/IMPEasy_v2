import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { buildItemCode } from '../commercial-utils';
import { ItemsService } from '../items/items.service';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateMaterialIssueDto } from './dto/create-material-issue.dto';
import { CriticalOnHandResponseDto } from './dto/critical-on-hand-response.dto';
import { InventoryItemResponseDto } from './dto/inventory-item-response.dto';
import { InventoryTransactionResponseDto } from './dto/inventory-transaction-response.dto';
import { LinkedStockDocumentResponseDto, StockItemDetailResponseDto } from './dto/stock-item-detail-response.dto';
import { StockItemResponseDto } from './dto/stock-item-response.dto';
import { StockLotDetailResponseDto, StockLotReservationResponseDto } from './dto/stock-lot-detail-response.dto';
import { StockLotResponseDto } from './dto/stock-lot-response.dto';
import { StockMovementResponseDto } from './dto/stock-movement-response.dto';

type PrismaLike = PrismaService | Prisma.TransactionClient;

type PurchaseOrderLineReceiptInput = {
  itemId: number;
  purchaseOrderLineId: number;
  quantity: number;
  existingLotId?: number;
  lotNumber?: string;
  receiptDate?: Date;
  referenceNumber?: string;
  notes?: string;
};

type StockItemSummary = {
  itemId: number;
  onHandQuantity: number;
  bookedQuantity: number;
  expectedQuantity: number;
  wipQuantity: number;
};

type TransactionLogInput = {
  itemId: number;
  stockLotId?: number | null;
  purchaseOrderLineId?: number | null;
  transactionType: string;
  quantity: number;
  referenceType?: string | null;
  referenceId?: number | null;
  referenceNumber?: string | null;
  transactionDate?: Date;
  notes?: string | null;
};

type StockLotRecord = Prisma.StockLotGetPayload<{
  include: {
    item: {
      select: {
        id: true;
        code: true;
        name: true;
      };
    };
    sourceWorkOrder: {
      select: {
        id: true;
      };
    };
  };
}>;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemsService: ItemsService,
    private readonly numberingService: NumberingService,
  ) {}

  listInventoryItems(): Promise<InventoryItemResponseDto[]> {
    return this.prisma.inventoryItem.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findInventoryItem(id: number): Promise<InventoryItemResponseDto> {
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }

    return inventoryItem;
  }

  async createInventoryItem(payload: CreateInventoryItemDto): Promise<InventoryItemResponseDto> {
    await this.itemsService.findOne(payload.itemId);

    const existing = await this.prisma.inventoryItem.findUnique({
      where: { itemId: payload.itemId },
    });

    if (existing) {
      throw new BadRequestException(`Inventory item for item ${payload.itemId} already exists`);
    }

    return this.prisma.inventoryItem.create({
      data: {
        itemId: payload.itemId,
        quantityOnHand: payload.quantityOnHand ?? 0,
      },
    });
  }

  async listTransactions(inventoryItemId: number): Promise<InventoryTransactionResponseDto[]> {
    await this.findInventoryItem(inventoryItemId);

    return this.prisma.inventoryTransaction.findMany({
      where: { inventoryItemId },
      orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
    });
  }

  async issueMaterial(
    inventoryItemId: number,
    payload: CreateMaterialIssueDto,
  ): Promise<InventoryTransactionResponseDto> {
    const inventoryItem = await this.findInventoryItem(inventoryItemId);

    if (inventoryItem.quantityOnHand < payload.quantity) {
      throw new BadRequestException(
        `Insufficient stock for inventory item ${inventoryItemId}. Available: ${inventoryItem.quantityOnHand}, requested: ${payload.quantity}`,
      );
    }

    await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantityOnHand: inventoryItem.quantityOnHand - payload.quantity,
      },
    });

    return this.prisma.inventoryTransaction.create({
      data: {
        inventoryItemId,
        itemId: inventoryItem.itemId,
        purchaseOrderLineId: null,
        transactionType: 'issue',
        quantity: payload.quantity,
        notes: payload.notes?.trim() || null,
      },
    });
  }

  async adjustInventory(
    inventoryItemId: number,
    payload: CreateInventoryAdjustmentDto,
  ): Promise<InventoryTransactionResponseDto> {
    const inventoryItem = await this.findInventoryItem(inventoryItemId);
    const nextQuantityOnHand = inventoryItem.quantityOnHand + payload.delta;

    if (nextQuantityOnHand < 0) {
      throw new BadRequestException(
        `Inventory adjustment would reduce stock below zero for inventory item ${inventoryItemId}. Available: ${inventoryItem.quantityOnHand}, delta: ${payload.delta}`,
      );
    }

    await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantityOnHand: nextQuantityOnHand,
      },
    });

    return this.prisma.inventoryTransaction.create({
      data: {
        inventoryItemId,
        itemId: inventoryItem.itemId,
        purchaseOrderLineId: null,
        transactionType: 'adjustment',
        quantity: payload.delta,
        notes: payload.notes?.trim() || null,
      },
    });
  }

  async getReceivedQuantitiesByPurchaseOrderLineIds(
    purchaseOrderLineIds: number[],
  ): Promise<Map<number, number>> {
    if (purchaseOrderLineIds.length === 0) {
      return new Map<number, number>();
    }

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        transactionType: {
          in: ['receive', 'purchase_receipt'],
        },
        purchaseOrderLineId: {
          in: purchaseOrderLineIds,
        },
      },
      orderBy: { id: 'asc' },
    });

    const receivedByLine = new Map<number, number>();

    for (const transaction of transactions) {
      if (transaction.purchaseOrderLineId === null) {
        continue;
      }

      const current = receivedByLine.get(transaction.purchaseOrderLineId) ?? 0;
      receivedByLine.set(transaction.purchaseOrderLineId, current + transaction.quantity);
    }

    return receivedByLine;
  }

  async receivePurchaseOrderLine(
    payload: PurchaseOrderLineReceiptInput,
    prisma: PrismaLike = this.prisma,
  ): Promise<InventoryTransactionResponseDto> {
    const inventoryItem = await this.ensureInventoryItemSummary(payload.itemId, prisma);
    const lot = await this.resolveReceiptLot(payload, prisma);
    const receiptDate = payload.receiptDate ?? new Date();

    await prisma.stockLot.update({
      where: { id: lot.id },
      data: {
        quantityOnHand: lot.quantityOnHand + payload.quantity,
        receivedAt: receiptDate,
        status: 'available',
        sourceType: 'purchase_receipt',
        sourceReference: payload.referenceNumber ?? lot.sourceReference ?? null,
        notes:
          payload.notes?.trim() || lot.notes || 'Received against an open purchase order line.',
      },
    });

    await this.syncInventoryItemQuantity(payload.itemId, prisma);

    return prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: inventoryItem.id,
        itemId: payload.itemId,
        stockLotId: lot.id,
        purchaseOrderLineId: payload.purchaseOrderLineId,
        transactionType: 'purchase_receipt',
        quantity: payload.quantity,
        referenceType: 'purchase_order',
        referenceId: payload.purchaseOrderLineId,
        referenceNumber: payload.referenceNumber ?? null,
        transactionDate: receiptDate,
        notes: payload.notes?.trim() || null,
      },
    });
  }

  async listStockItems(): Promise<StockItemResponseDto[]> {
    const items = await this.prisma.item.findMany({
      where: { isActive: true },
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        unitOfMeasure: true,
        reorderPoint: true,
      },
    });

    const summaryByItem = await this.buildStockSummaryMap(items.map((item) => item.id));

    return items
      .map((item) => this.toStockItemResponse(item, summaryByItem.get(item.id)))
      .filter((item) => {
        return (
          item.onHandQuantity > 0 ||
          item.bookedQuantity > 0 ||
          item.expectedQuantity > 0 ||
          item.wipQuantity > 0 ||
          item.reorderPoint > 0
        );
      });
  }

  async findStockItem(itemId: number): Promise<StockItemDetailResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        code: true,
        name: true,
        unitOfMeasure: true,
        reorderPoint: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const summaryByItem = await this.buildStockSummaryMap([itemId]);
    const lots = await this.listLotsForItems([itemId], undefined, numberingSnapshot);
    const movements = await this.listMovementRecords({
      where: { itemId },
    }, numberingSnapshot);

    const linkedDocuments = new Map<string, LinkedStockDocumentResponseDto>();

    for (const lot of lots) {
      if (lot.sourceDocument) {
        linkedDocuments.set(`lot-${lot.sourceDocument}`, {
          kind: 'Lot source',
          reference: lot.sourceDocument,
        });
      }
    }

    for (const movement of movements) {
      if (movement.reference) {
        linkedDocuments.set(`movement-${movement.reference}`, {
          kind: 'Movement',
          reference: movement.reference,
        });
      }
    }

    const summary = summaryByItem.get(itemId);

    return {
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      unitOfMeasure: item.unitOfMeasure,
      reorderPoint: item.reorderPoint,
      onHandQuantity: summary?.onHandQuantity ?? 0,
      availableQuantity: Math.max(
        0,
        (summary?.onHandQuantity ?? 0) - (summary?.bookedQuantity ?? 0),
      ),
      bookedQuantity: summary?.bookedQuantity ?? 0,
      expectedQuantity: summary?.expectedQuantity ?? 0,
      wipQuantity: summary?.wipQuantity ?? 0,
      lots,
      movements,
      linkedDocuments: Array.from(linkedDocuments.values()),
    };
  }

  async listStockLots(): Promise<StockLotResponseDto[]> {
    return this.listLotsForItems(
      undefined,
      undefined,
      await this.numberingService.getSnapshot(),
    );
  }

  async findStockLot(id: number): Promise<StockLotDetailResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const lot = await this.prisma.stockLot.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        sourceWorkOrder: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!lot) {
      throw new NotFoundException(`Stock lot ${id} not found`);
    }

    const reservationMaps = await this.buildReservationMaps([id]);
    const reservedQuantity =
      (reservationMaps.materialReservedByLot.get(id) ?? 0) +
      (reservationMaps.shipmentReservedByLot.get(id) ?? 0);
    const reservations: StockLotReservationResponseDto[] = [];

    const materialBookings = await this.prisma.materialBooking.findMany({
      where: {
        stockLotId: id,
        consumedAt: null,
      },
      include: {
        workOrder: {
          select: {
            id: true,
          },
        },
      },
    });

    for (const booking of materialBookings) {
      reservations.push({
        kind: 'Manufacturing Order',
        reference: this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'manufacturing_orders',
          booking.workOrder.id,
        ),
        quantity: booking.quantity,
      });
    }

    const shipmentPicks = await this.prisma.shipmentPick.findMany({
      where: {
        stockLotId: id,
        shipmentLine: {
          shipment: {
            status: {
              in: ['draft', 'picked'],
            },
          },
        },
      },
      include: {
        shipmentLine: {
          include: {
            shipment: {
              select: {
                id: true,
                number: true,
              },
            },
          },
        },
      },
    });

    for (const pick of shipmentPicks) {
      reservations.push({
        kind: 'Shipment',
        reference:
          pick.shipmentLine.shipment.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'shipments',
            pick.shipmentLine.shipment.id,
          ),
        quantity: pick.quantity,
      });
    }

    return {
      id: lot.id,
      itemId: lot.itemId,
      itemCode: lot.item.code,
      itemName: lot.item.name,
      lotNumber: lot.lotNumber,
      sourceDocument: this.formatLotSource(lot, numberingSnapshot),
      receivedOrProducedAt: lot.receivedAt ?? lot.createdAt,
      quantityOnHand: lot.quantityOnHand,
      reservedQuantity,
      availableQuantity: Math.max(0, lot.quantityOnHand - reservedQuantity),
      status: this.resolveLotStatus(lot.quantityOnHand, reservedQuantity),
      notes: lot.notes ?? null,
      reservations,
    };
  }

  async listStockMovements(): Promise<StockMovementResponseDto[]> {
    return this.listMovementRecords(
      undefined,
      await this.numberingService.getSnapshot(),
    );
  }

  async listCriticalOnHand(): Promise<CriticalOnHandResponseDto[]> {
    const stockItems = await this.listStockItems();

    return stockItems
      .filter((item) => item.reorderPoint > 0 || item.availableQuantity <= item.reorderPoint)
      .map((item) => ({
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        onHandQuantity: item.onHandQuantity,
        availableQuantity: item.availableQuantity,
        reorderPoint: item.reorderPoint,
        shortageState:
          item.availableQuantity <= 0
            ? 'critical'
            : item.availableQuantity < item.reorderPoint
              ? 'warning'
              : 'healthy',
      }));
  }

  async listAvailableLotsForItem(
    itemId: number,
    options?: {
      includePickedForShipmentId?: number;
    },
  ): Promise<StockLotResponseDto[]> {
    const lots = await this.listLotsForItems(
      [itemId],
      options,
      await this.numberingService.getSnapshot(),
    );
    return lots.filter((lot) => lot.availableQuantity > 0 || lot.quantityOnHand > 0);
  }

  async syncInventoryItemQuantity(
    itemId: number,
    prisma: PrismaLike = this.prisma,
  ): Promise<InventoryItemResponseDto> {
    const inventoryItem = await this.ensureInventoryItemSummary(itemId, prisma);
    const aggregate = await prisma.stockLot.aggregate({
      where: { itemId },
      _sum: { quantityOnHand: true },
    });

    return prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        quantityOnHand: aggregate._sum.quantityOnHand ?? 0,
      },
    });
  }

  async recordTransaction(
    input: TransactionLogInput,
    prisma: PrismaLike = this.prisma,
  ): Promise<InventoryTransactionResponseDto> {
    const inventoryItem = await this.ensureInventoryItemSummary(input.itemId, prisma);

    return prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: inventoryItem.id,
        itemId: input.itemId,
        stockLotId: input.stockLotId ?? null,
        purchaseOrderLineId: input.purchaseOrderLineId ?? null,
        transactionType: input.transactionType,
        quantity: input.quantity,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        referenceNumber: input.referenceNumber ?? null,
        transactionDate: input.transactionDate ?? new Date(),
        notes: input.notes ?? null,
      },
    });
  }

  private async ensureInventoryItemSummary(
    itemId: number,
    prisma: PrismaLike,
  ): Promise<InventoryItemResponseDto> {
    await this.itemsService.findOne(itemId);

    const existing = await prisma.inventoryItem.findUnique({
      where: { itemId },
    });

    if (existing) {
      return existing;
    }

    return prisma.inventoryItem.create({
      data: {
        itemId,
        quantityOnHand: 0,
      },
    });
  }

  private async resolveReceiptLot(
    payload: PurchaseOrderLineReceiptInput,
    prisma: PrismaLike,
  ): Promise<Prisma.StockLotGetPayload<{}>> {
    if (payload.existingLotId) {
      const existingLot = await prisma.stockLot.findUnique({
        where: { id: payload.existingLotId },
      });

      if (!existingLot) {
        throw new NotFoundException(`Stock lot ${payload.existingLotId} not found`);
      }

      if (existingLot.itemId !== payload.itemId) {
        throw new BadRequestException(
          `Stock lot ${payload.existingLotId} does not belong to item ${payload.itemId}`,
        );
      }

      return existingLot;
    }

    const lotNumber = payload.lotNumber?.trim();
    if (!lotNumber) {
      throw new BadRequestException('Provide a lot number or choose an existing lot for receipt.');
    }

    const existingByNumber = await prisma.stockLot.findUnique({
      where: { lotNumber },
    });

    if (existingByNumber) {
      if (existingByNumber.itemId !== payload.itemId) {
        throw new BadRequestException(
          `Lot ${lotNumber} already belongs to another item and cannot be reused here.`,
        );
      }

      return existingByNumber;
    }

    return prisma.stockLot.create({
      data: {
        itemId: payload.itemId,
        lotNumber,
        quantityOnHand: 0,
        sourceType: 'purchase_receipt',
        sourceReference: payload.referenceNumber ?? null,
        receivedAt: payload.receiptDate ?? new Date(),
        status: 'available',
        notes: payload.notes?.trim() || null,
      },
    });
  }

  private async buildStockSummaryMap(itemIds: number[]): Promise<Map<number, StockItemSummary>> {
    const scopedItemIds = itemIds.length > 0 ? itemIds : undefined;

    const [lotAggregates, materialBookings, shipmentPicks, purchaseOrderLines, workOrders] =
      await Promise.all([
        this.prisma.stockLot.groupBy({
          by: ['itemId'],
          ...(scopedItemIds
            ? {
                where: {
                  itemId: {
                    in: scopedItemIds,
                  },
                },
              }
            : {}),
          _sum: {
            quantityOnHand: true,
          },
        }),
        this.prisma.materialBooking.findMany({
          where: {
            consumedAt: null,
            ...(scopedItemIds
              ? {
                  stockLot: {
                    itemId: {
                      in: scopedItemIds,
                    },
                  },
                }
              : {}),
          },
          include: {
            stockLot: {
              select: {
                itemId: true,
              },
            },
          },
        }),
        this.prisma.shipmentPick.findMany({
          where: {
            shipmentLine: {
              shipment: {
                status: {
                  in: ['draft', 'picked'],
                },
              },
            },
            ...(scopedItemIds
              ? {
                  stockLot: {
                    itemId: {
                      in: scopedItemIds,
                    },
                  },
                }
              : {}),
          },
          include: {
            stockLot: {
              select: {
                itemId: true,
              },
            },
          },
        }),
        this.prisma.purchaseOrderLine.findMany({
          where: scopedItemIds
            ? {
                itemId: {
                  in: scopedItemIds,
                },
              }
            : undefined,
          select: {
            id: true,
            itemId: true,
            quantity: true,
          },
        }),
        this.prisma.workOrder.findMany({
          where: {
            status: {
              in: ['planned', 'released', 'in_progress'],
            },
            ...(scopedItemIds
              ? {
                  salesOrderLine: {
                    itemId: {
                      in: scopedItemIds,
                    },
                  },
                }
              : {}),
          },
          select: {
            quantity: true,
            salesOrderLine: {
              select: {
                itemId: true,
              },
            },
          },
        }),
      ]);

    const receivedByLine = await this.getReceivedQuantitiesByPurchaseOrderLineIds(
      purchaseOrderLines.map((line) => line.id),
    );

    const summaryByItem = new Map<number, StockItemSummary>();

    for (const aggregate of lotAggregates) {
      summaryByItem.set(aggregate.itemId, {
        itemId: aggregate.itemId,
        onHandQuantity: aggregate._sum.quantityOnHand ?? 0,
        bookedQuantity: 0,
        expectedQuantity: 0,
        wipQuantity: 0,
      });
    }

    const ensureSummary = (itemId: number): StockItemSummary => {
      const existing = summaryByItem.get(itemId);
      if (existing) {
        return existing;
      }

      const created: StockItemSummary = {
        itemId,
        onHandQuantity: 0,
        bookedQuantity: 0,
        expectedQuantity: 0,
        wipQuantity: 0,
      };
      summaryByItem.set(itemId, created);
      return created;
    };

    for (const booking of materialBookings) {
      ensureSummary(booking.stockLot.itemId).bookedQuantity += booking.quantity;
    }

    for (const pick of shipmentPicks) {
      ensureSummary(pick.stockLot.itemId).bookedQuantity += pick.quantity;
    }

    for (const line of purchaseOrderLines) {
      const remainingQuantity = Math.max(line.quantity - (receivedByLine.get(line.id) ?? 0), 0);
      ensureSummary(line.itemId).expectedQuantity += remainingQuantity;
    }

    for (const workOrder of workOrders) {
      ensureSummary(workOrder.salesOrderLine.itemId).wipQuantity += workOrder.quantity;
    }

    return summaryByItem;
  }

  private toStockItemResponse(
    item: {
      id: number;
      code: string | null;
      name: string;
      unitOfMeasure: string;
      reorderPoint: number;
    },
    summary?: StockItemSummary,
  ): StockItemResponseDto {
    const onHandQuantity = summary?.onHandQuantity ?? 0;
    const bookedQuantity = summary?.bookedQuantity ?? 0;

    return {
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      unitOfMeasure: item.unitOfMeasure,
      onHandQuantity,
      availableQuantity: Math.max(0, onHandQuantity - bookedQuantity),
      bookedQuantity,
      expectedQuantity: summary?.expectedQuantity ?? 0,
      wipQuantity: summary?.wipQuantity ?? 0,
      reorderPoint: item.reorderPoint,
    };
  }

  private async listLotsForItems(
    itemIds?: number[],
    options?: {
      includePickedForShipmentId?: number;
    },
    numberingSnapshot?: NumberingSnapshot,
  ): Promise<StockLotResponseDto[]> {
    const resolvedNumberingSnapshot =
      numberingSnapshot ?? (await this.numberingService.getSnapshot());
    const lots = await this.prisma.stockLot.findMany({
      where: itemIds?.length
        ? {
            itemId: {
              in: itemIds,
            },
          }
        : undefined,
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        sourceWorkOrder: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ lotNumber: 'asc' }],
    });

    const reservationMaps = await this.buildReservationMaps(
      lots.map((lot) => lot.id),
      options,
    );

    return lots.map((lot) => {
      const reservedQuantity =
        (reservationMaps.materialReservedByLot.get(lot.id) ?? 0) +
        (reservationMaps.shipmentReservedByLot.get(lot.id) ?? 0);

      return {
        id: lot.id,
        itemId: lot.itemId,
        itemCode: lot.item.code,
        itemName: lot.item.name,
        lotNumber: lot.lotNumber,
        sourceDocument: this.formatLotSource(lot, resolvedNumberingSnapshot),
        quantityOnHand: lot.quantityOnHand,
        reservedQuantity,
        availableQuantity: Math.max(0, lot.quantityOnHand - reservedQuantity),
        status: this.resolveLotStatus(lot.quantityOnHand, reservedQuantity),
        receivedOrProducedAt: lot.receivedAt ?? lot.createdAt,
        notes: lot.notes ?? null,
      };
    });
  }

  private async buildReservationMaps(
    lotIds: number[],
    options?: {
      includePickedForShipmentId?: number;
    },
  ): Promise<{
    materialReservedByLot: Map<number, number>;
    shipmentReservedByLot: Map<number, number>;
  }> {
    if (lotIds.length === 0) {
      return {
        materialReservedByLot: new Map<number, number>(),
        shipmentReservedByLot: new Map<number, number>(),
      };
    }

    const [materialBookings, shipmentPicks] = await Promise.all([
      this.prisma.materialBooking.findMany({
        where: {
          stockLotId: {
            in: lotIds,
          },
          consumedAt: null,
        },
        select: {
          stockLotId: true,
          quantity: true,
        },
      }),
      this.prisma.shipmentPick.findMany({
        where: {
          stockLotId: {
            in: lotIds,
          },
          shipmentLine: {
            shipment: {
              status: {
                in: ['draft', 'picked'],
              },
            },
          },
        },
        select: {
          stockLotId: true,
          quantity: true,
          shipmentLine: {
            select: {
              shipment: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const materialReservedByLot = new Map<number, number>();
    const shipmentReservedByLot = new Map<number, number>();

    for (const booking of materialBookings) {
      materialReservedByLot.set(
        booking.stockLotId,
        (materialReservedByLot.get(booking.stockLotId) ?? 0) + booking.quantity,
      );
    }

    for (const pick of shipmentPicks) {
      if (
        options?.includePickedForShipmentId &&
        pick.shipmentLine.shipment.id === options.includePickedForShipmentId
      ) {
        continue;
      }

      shipmentReservedByLot.set(
        pick.stockLotId,
        (shipmentReservedByLot.get(pick.stockLotId) ?? 0) + pick.quantity,
      );
    }

    return {
      materialReservedByLot,
      shipmentReservedByLot,
    };
  }

  private formatLotSource(lot: {
    sourceReference?: string | null;
    sourceType?: string | null;
    sourceWorkOrderId?: number | null;
  }, numberingSnapshot: NumberingSnapshot): string | null {
    if (lot.sourceReference) {
      return lot.sourceReference;
    }

    if (lot.sourceType === 'manufacturing_order' && lot.sourceWorkOrderId) {
      return this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'manufacturing_orders',
        lot.sourceWorkOrderId,
      );
    }

    if (lot.sourceWorkOrderId) {
      return this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'manufacturing_orders',
        lot.sourceWorkOrderId,
      );
    }

    return null;
  }

  private resolveLotStatus(quantityOnHand: number, reservedQuantity: number): string {
    if (quantityOnHand <= 0) {
      return 'exhausted';
    }

    if (reservedQuantity >= quantityOnHand) {
      return 'fully reserved';
    }

    if (reservedQuantity > 0) {
      return 'reserved';
    }

    return 'available';
  }

  private async listMovementRecords(input?: {
    where?: Prisma.InventoryTransactionWhereInput;
  }, numberingSnapshot?: NumberingSnapshot): Promise<StockMovementResponseDto[]> {
    const resolvedNumberingSnapshot =
      numberingSnapshot ?? (await this.numberingService.getSnapshot());
    const movements = await this.prisma.inventoryTransaction.findMany({
      where: input?.where,
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        stockLot: {
          select: {
            id: true,
            lotNumber: true,
          },
        },
      },
      orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
    });

    return movements.map((movement) => ({
      id: movement.id,
      itemId: movement.itemId,
      itemCode: movement.item.code ?? buildItemCode(movement.itemId),
      itemName: movement.item.name,
      stockLotId: movement.stockLotId ?? null,
      lotNumber: movement.stockLot?.lotNumber ?? null,
      movementType: movement.transactionType,
      quantity: movement.quantity,
      reference:
        movement.referenceNumber ??
        (movement.purchaseOrderLineId
          ? `${this.numberingService.formatFromSnapshot(
              resolvedNumberingSnapshot,
              'purchase_orders',
              movement.purchaseOrderLineId,
            )} line ${movement.purchaseOrderLineId}`
          : null),
      transactionDate: movement.transactionDate,
      notes: movement.notes ?? null,
    }));
  }
}
