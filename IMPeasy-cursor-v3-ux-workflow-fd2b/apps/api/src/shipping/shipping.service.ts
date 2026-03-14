import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { buildItemCode } from '../commercial-utils';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import {
  ShipmentDetailResponseDto,
  ShipmentHistoryEntryResponseDto,
  ShipmentLineAvailabilityResponseDto,
} from './dto/shipment-detail-response.dto';
import { ShipmentPickResponseDto } from './dto/shipment-pick-response.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { ShippingAvailabilityLineDto } from './dto/shipping-availability-line.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpsertShipmentPicksDto } from './dto/upsert-shipment-picks.dto';

const SHIPPABLE_SALES_ORDER_STATUSES = new Set(['released', 'in_production']);

const SHIPMENT_INCLUDE = {
  salesOrder: {
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  shipmentLines: {
    include: {
      salesOrderLine: true,
      shipmentPicks: {
        include: {
          stockLot: {
            select: {
              id: true,
              lotNumber: true,
              quantityOnHand: true,
            },
          },
        },
        orderBy: [{ id: 'asc' }],
      },
    },
    orderBy: [{ id: 'asc' }],
  },
} satisfies Prisma.ShipmentInclude;

const INVOICE_DETAIL_INCLUDE = {
  invoiceLines: {
    include: {
      shipmentLine: {
        include: {
          salesOrderLine: true,
        },
      },
    },
    orderBy: [{ id: 'asc' }],
  },
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.InvoiceInclude;

type ShipmentRecord = Prisma.ShipmentGetPayload<{
  include: typeof SHIPMENT_INCLUDE;
}>;
type ShipmentInvoiceRecord = Prisma.InvoiceGetPayload<{
  include: typeof INVOICE_DETAIL_INCLUDE;
}>;

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesOrdersService: SalesOrdersService,
    private readonly inventoryService: InventoryService,
    private readonly numberingService: NumberingService,
  ) {}

  async listAll(): Promise<ShipmentResponseDto[]> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const shipments = await this.prisma.shipment.findMany({
      include: SHIPMENT_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return shipments.map((shipment) => this.mapShipmentSummary(shipment, numberingSnapshot));
  }

  async listBySalesOrder(salesOrderId: number): Promise<ShipmentResponseDto[]> {
    await this.salesOrdersService.findOne(salesOrderId);
    const numberingSnapshot = await this.numberingService.getSnapshot();

    const shipments = await this.prisma.shipment.findMany({
      where: { salesOrderId },
      include: SHIPMENT_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return shipments.map((shipment) => this.mapShipmentSummary(shipment, numberingSnapshot));
  }

  async findOne(shipmentId: number): Promise<ShipmentDetailResponseDto> {
    const shipment = await this.findShipmentOrThrow(shipmentId);
    return this.mapShipmentDetail(shipment, await this.numberingService.getSnapshot());
  }

  async listAvailabilityBySalesOrder(
    salesOrderId: number,
  ): Promise<ShippingAvailabilityLineDto[]> {
    const salesOrder = await this.salesOrdersService.findOne(salesOrderId);
    const committedByLine = await this.getCommittedShipmentQuantityByLine(salesOrderId);

    return Promise.all(
      salesOrder.salesOrderLines.map(async (line) => {
        const availableLots = await this.inventoryService.listAvailableLotsForItem(line.itemId);
        const availableStockQuantity = availableLots.reduce(
          (sum, lot) => sum + lot.availableQuantity,
          0,
        );
        const shippedQuantity = committedByLine.get(line.id) ?? 0;
        const remainingQuantity = Math.max(line.quantity - shippedQuantity, 0);

        return {
          salesOrderLineId: line.id,
          itemId: line.itemId,
          itemCode: line.itemCode ?? null,
          itemName: line.itemName ?? `Item ${line.itemId}`,
          orderedQuantity: line.quantity,
          shippedQuantity,
          remainingQuantity,
          availableStockQuantity,
          blockedReason: this.resolveBlockedReason(
            salesOrder.status,
            remainingQuantity,
            availableStockQuantity,
          ),
        };
      }),
    );
  }

  async create(payload: CreateShipmentDto): Promise<ShipmentResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const salesOrder = await this.salesOrdersService.findOne(payload.salesOrderId);

    if (!SHIPPABLE_SALES_ORDER_STATUSES.has(salesOrder.status)) {
      throw new BadRequestException(
        `Shipments can only be created for released or in_production sales orders. Current status: ${salesOrder.status}`,
      );
    }

    const orderLineIds = new Set(salesOrder.salesOrderLines.map((line) => line.id));
    const committedByLine = await this.getCommittedShipmentQuantityByLine(payload.salesOrderId);
    const seenLineIds = new Set<number>();

    for (const line of payload.lines) {
      if (seenLineIds.has(line.salesOrderLineId)) {
        throw new BadRequestException(
          `Shipment request contains duplicate sales order line ${line.salesOrderLineId}`,
        );
      }

      seenLineIds.add(line.salesOrderLineId);

      if (!orderLineIds.has(line.salesOrderLineId)) {
        throw new BadRequestException(
          `Sales order line ${line.salesOrderLineId} does not belong to sales order ${payload.salesOrderId}`,
        );
      }

      const sourceLine = salesOrder.salesOrderLines.find(
        (candidate) => candidate.id === line.salesOrderLineId,
      );
      if (!sourceLine) {
        continue;
      }

      const remainingQuantity = Math.max(
        sourceLine.quantity - (committedByLine.get(sourceLine.id) ?? 0),
        0,
      );
      if (line.quantity > remainingQuantity) {
        throw new BadRequestException(
          `Shipment quantity for sales order line ${line.salesOrderLineId} exceeds the remaining quantity ${remainingQuantity}.`,
        );
      }
    }

    const created = await this.prisma.shipment.create({
      data: {
        salesOrderId: payload.salesOrderId,
        status: 'draft',
        carrierMethod: payload.carrierMethod?.trim() || null,
        trackingNumber: payload.trackingNumber?.trim() || null,
        notes: payload.notes?.trim() || null,
        shipmentLines: {
          create: payload.lines.map((line) => ({
            salesOrderLineId: line.salesOrderLineId,
            quantity: line.quantity,
          })),
        },
      },
      include: SHIPMENT_INCLUDE,
    });

    const numbered = await this.prisma.shipment.update({
      where: { id: created.id },
      data: {
        number:
          created.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'shipments',
            created.id,
          ),
      },
      include: SHIPMENT_INCLUDE,
    });

    return this.mapShipmentSummary(numbered, numberingSnapshot);
  }

  async update(shipmentId: number, payload: UpdateShipmentDto): Promise<ShipmentDetailResponseDto> {
    await this.findShipmentOrThrow(shipmentId);

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        shipDate: payload.shipDate ? new Date(payload.shipDate) : undefined,
        carrierMethod:
          payload.carrierMethod !== undefined ? payload.carrierMethod.trim() || null : undefined,
        trackingNumber:
          payload.trackingNumber !== undefined ? payload.trackingNumber.trim() || null : undefined,
        notes: payload.notes !== undefined ? payload.notes.trim() || null : undefined,
      },
    });

    return this.findOne(shipmentId);
  }

  async upsertPicks(
    shipmentId: number,
    payload: UpsertShipmentPicksDto,
  ): Promise<ShipmentDetailResponseDto> {
    const shipment = await this.findShipmentOrThrow(shipmentId);

    if (!['draft', 'picked'].includes(shipment.status)) {
      throw new BadRequestException(
        `Lot allocations can only be edited while a shipment is draft or picked. Current status: ${shipment.status}`,
      );
    }

    const linesById = new Map(shipment.shipmentLines.map((line) => [line.id, line]));
    const lineQuantityById = new Map<number, number>();
    const availableLotsByItem = new Map<number, Awaited<
      ReturnType<typeof this.inventoryService.listAvailableLotsForItem>
    >>();

    for (const pick of payload.picks) {
      const shipmentLine = linesById.get(pick.shipmentLineId);
      if (!shipmentLine) {
        throw new BadRequestException(
          `Shipment line ${pick.shipmentLineId} does not belong to shipment ${shipmentId}`,
        );
      }

      const stockLot = await this.prisma.stockLot.findUnique({
        where: { id: pick.stockLotId },
        select: {
          id: true,
          itemId: true,
        },
      });

      if (!stockLot) {
        throw new NotFoundException(`Stock lot ${pick.stockLotId} not found`);
      }

      if (stockLot.itemId !== shipmentLine.salesOrderLine.itemId) {
        throw new BadRequestException(
          `Stock lot ${pick.stockLotId} does not belong to shipment item ${shipmentLine.salesOrderLine.itemId}`,
        );
      }

      if (!availableLotsByItem.has(stockLot.itemId)) {
        availableLotsByItem.set(
          stockLot.itemId,
          await this.inventoryService.listAvailableLotsForItem(stockLot.itemId, {
            includePickedForShipmentId: shipmentId,
          }),
        );
      }

      const availableLot = availableLotsByItem
        .get(stockLot.itemId)
        ?.find((candidate) => candidate.id === stockLot.id);
      if (!availableLot || pick.quantity > availableLot.availableQuantity) {
        throw new BadRequestException(
          `Requested pick quantity for lot ${pick.stockLotId} exceeds available quantity.`,
        );
      }

      lineQuantityById.set(
        pick.shipmentLineId,
        (lineQuantityById.get(pick.shipmentLineId) ?? 0) + pick.quantity,
      );
    }

    for (const [shipmentLineId, pickedQuantity] of lineQuantityById.entries()) {
      const shipmentLine = linesById.get(shipmentLineId);
      if (!shipmentLine) {
        continue;
      }

      if (pickedQuantity > shipmentLine.quantity) {
        throw new BadRequestException(
          `Picked quantity ${pickedQuantity} exceeds required quantity ${shipmentLine.quantity} for shipment line ${shipmentLineId}.`,
        );
      }
    }

    for (const pick of payload.picks) {
      const existing = await this.prisma.shipmentPick.findUnique({
        where: {
          shipmentLineId_stockLotId: {
            shipmentLineId: pick.shipmentLineId,
            stockLotId: pick.stockLotId,
          },
        },
      });

      if (existing) {
        await this.prisma.shipmentPick.update({
          where: { id: existing.id },
          data: {
            quantity: pick.quantity,
            notes: pick.notes?.trim() || null,
          },
        });
      } else {
        await this.prisma.shipmentPick.create({
          data: {
            shipmentLineId: pick.shipmentLineId,
            stockLotId: pick.stockLotId,
            quantity: pick.quantity,
            notes: pick.notes?.trim() || null,
          },
        });
      }
    }

    return this.findOne(shipmentId);
  }

  async pick(shipmentId: number): Promise<ShipmentResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const shipment = await this.findShipmentOrThrow(shipmentId);

    if (shipment.status !== 'draft') {
      throw new BadRequestException(
        `Only draft shipments can be picked. Current status: ${shipment.status}`,
      );
    }

    if (shipment.shipmentLines.length === 0) {
      throw new BadRequestException(`Shipment ${shipmentId} has no lines and cannot be picked`);
    }

    for (const line of shipment.shipmentLines) {
      const pickedQuantity = line.shipmentPicks.reduce((sum, pick) => sum + pick.quantity, 0);
      if (pickedQuantity !== line.quantity) {
        throw new BadRequestException(
          `Shipment line ${line.id} requires ${line.quantity} picked, but ${pickedQuantity} is allocated.`,
        );
      }
    }

    for (const line of shipment.shipmentLines) {
      for (const pick of line.shipmentPicks) {
        await this.prisma.shipmentPick.update({
          where: { id: pick.id },
          data: {
            pickedAt: pick.pickedAt ?? new Date(),
          },
        });

        await this.inventoryService.recordTransaction({
          itemId: line.salesOrderLine.itemId,
          stockLotId: pick.stockLotId,
          transactionType: 'shipment_pick',
          quantity: -pick.quantity,
          referenceType: 'shipment',
          referenceId: shipment.id,
          referenceNumber:
            shipment.number ??
            this.numberingService.formatFromSnapshot(
              numberingSnapshot,
              'shipments',
              shipment.id,
            ),
          transactionDate: new Date(),
          notes: `Allocated ${pick.quantity} from ${pick.stockLot.lotNumber} to shipment.`,
        });
      }
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: 'picked' },
      include: SHIPMENT_INCLUDE,
    });

    return this.mapShipmentSummary(updated, numberingSnapshot);
  }

  async ship(shipmentId: number): Promise<ShipmentResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const shipment = await this.findShipmentOrThrow(shipmentId);

    if (shipment.status !== 'picked') {
      throw new BadRequestException(
        `Only picked shipments can be shipped. Current status: ${shipment.status}`,
      );
    }

    for (const line of shipment.shipmentLines) {
      const pickedQuantity = line.shipmentPicks.reduce((sum, pick) => sum + pick.quantity, 0);
      if (pickedQuantity !== line.quantity) {
        throw new BadRequestException(
          `Shipment line ${line.id} requires ${line.quantity} picked, but ${pickedQuantity} is allocated.`,
        );
      }
    }

    const affectedItemIds = new Set<number>();

    for (const line of shipment.shipmentLines) {
      affectedItemIds.add(line.salesOrderLine.itemId);

      for (const pick of line.shipmentPicks) {
        if (pick.stockLot.quantityOnHand < pick.quantity) {
          throw new BadRequestException(
            `Stock lot ${pick.stockLot.lotNumber} no longer has enough quantity to ship.`,
          );
        }

        await this.prisma.stockLot.update({
          where: { id: pick.stockLotId },
          data: {
            quantityOnHand: pick.stockLot.quantityOnHand - pick.quantity,
            status: pick.stockLot.quantityOnHand - pick.quantity > 0 ? 'available' : 'exhausted',
          },
        });

        await this.inventoryService.recordTransaction({
          itemId: line.salesOrderLine.itemId,
          stockLotId: pick.stockLotId,
          transactionType: 'shipment_issue',
          quantity: -pick.quantity,
          referenceType: 'shipment',
          referenceId: shipment.id,
          referenceNumber:
            shipment.number ??
            this.numberingService.formatFromSnapshot(
              numberingSnapshot,
              'shipments',
              shipment.id,
            ),
          transactionDate: new Date(),
          notes: `Shipped ${pick.quantity} from ${pick.stockLot.lotNumber}.`,
        });
      }
    }

    for (const itemId of affectedItemIds) {
      await this.inventoryService.syncInventoryItemQuantity(itemId);
    }

    const shipDate = shipment.shipDate ?? new Date();
    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'shipped',
        shipDate,
      },
      include: SHIPMENT_INCLUDE,
    });

    await this.updateSalesOrderStatusIfComplete(updated.salesOrderId, 'shipped');

    return this.mapShipmentSummary(updated, numberingSnapshot);
  }

  async deliver(shipmentId: number): Promise<ShipmentResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const shipment = await this.findShipmentOrThrow(shipmentId);

    if (shipment.status !== 'shipped') {
      throw new BadRequestException(
        `Only shipped shipments can be delivered. Current status: ${shipment.status}`,
      );
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(),
      },
      include: SHIPMENT_INCLUDE,
    });

    return this.mapShipmentSummary(updated, numberingSnapshot);
  }

  private async getCommittedShipmentQuantityByLine(
    salesOrderId: number,
  ): Promise<Map<number, number>> {
    const shipments = await this.prisma.shipment.findMany({
      where: { salesOrderId },
      include: {
        shipmentLines: {
          orderBy: { id: 'asc' },
        },
      },
    });

    const shippedQuantityByLine = new Map<number, number>();
    for (const shipment of shipments) {
      for (const line of shipment.shipmentLines) {
        shippedQuantityByLine.set(
          line.salesOrderLineId,
          (shippedQuantityByLine.get(line.salesOrderLineId) ?? 0) + line.quantity,
        );
      }
    }

    return shippedQuantityByLine;
  }

  private resolveBlockedReason(
    salesOrderStatus: string,
    remainingOrderQuantity: number,
    availableStockQuantity: number,
  ): string | null {
    if (remainingOrderQuantity === 0) {
      return 'This line is fully committed to shipments.';
    }

    if (!SHIPPABLE_SALES_ORDER_STATUSES.has(salesOrderStatus)) {
      return 'Shipment creation requires a released or in_production sales order.';
    }

    if (availableStockQuantity === 0) {
      return 'No finished-goods lots are currently available.';
    }

    return null;
  }

  private async findShipmentOrThrow(shipmentId: number) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: SHIPMENT_INCLUDE,
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }

    return shipment;
  }

  private mapShipmentSummary(
    shipment: ShipmentRecord,
    numberingSnapshot: NumberingSnapshot,
  ): ShipmentResponseDto {
    return {
      id: shipment.id,
      number:
        shipment.number ??
        this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'shipments',
          shipment.id,
        ),
      salesOrderId: shipment.salesOrderId,
      salesOrderNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'sales_orders',
        shipment.salesOrderId,
      ),
      customerId: shipment.salesOrder.customer.id,
      customerName: shipment.salesOrder.customer.name,
      status: shipment.status,
      shipDate: shipment.shipDate ?? null,
      carrierMethod: shipment.carrierMethod ?? null,
      trackingNumber: shipment.trackingNumber ?? null,
      deliveredAt: shipment.deliveredAt ?? null,
      notes: shipment.notes ?? null,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
      shipmentLines: shipment.shipmentLines.map((line) => ({
        id: line.id,
        shipmentId: line.shipmentId,
        salesOrderLineId: line.salesOrderLineId,
        itemId: line.salesOrderLine.itemId,
        itemCode: line.salesOrderLine.itemCode ?? null,
        itemName: line.salesOrderLine.itemName ?? `Item ${line.salesOrderLine.itemId}`,
        quantity: line.quantity,
        pickedQuantity: line.shipmentPicks.reduce((sum, pick) => sum + pick.quantity, 0),
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
      })),
    };
  }

  private async mapShipmentDetail(
    shipment: ShipmentRecord,
    numberingSnapshot: NumberingSnapshot,
  ): Promise<ShipmentDetailResponseDto> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { shipmentId: shipment.id },
      include: INVOICE_DETAIL_INCLUDE,
    });

    const lines: ShipmentLineAvailabilityResponseDto[] = [];
    for (const line of shipment.shipmentLines) {
      const availableLots = await this.inventoryService.listAvailableLotsForItem(
        line.salesOrderLine.itemId,
        {
          includePickedForShipmentId: shipment.id,
        },
      );

      const picks: ShipmentPickResponseDto[] = line.shipmentPicks.map((pick) => ({
        id: pick.id,
        shipmentLineId: pick.shipmentLineId,
        stockLotId: pick.stockLotId,
        lotNumber: pick.stockLot.lotNumber,
        quantity: pick.quantity,
        pickedAt: pick.pickedAt ?? null,
        notes: pick.notes ?? null,
        createdAt: pick.createdAt,
        updatedAt: pick.updatedAt,
      }));

      lines.push({
        id: line.id,
        shipmentId: line.shipmentId,
        salesOrderLineId: line.salesOrderLineId,
        itemId: line.salesOrderLine.itemId,
        itemCode: line.salesOrderLine.itemCode ?? null,
        itemName: line.salesOrderLine.itemName ?? `Item ${line.salesOrderLine.itemId}`,
        quantity: line.quantity,
        pickedQuantity: picks.reduce((sum, pick) => sum + pick.quantity, 0),
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
        availableLots,
        picks,
      });
    }

    const shipToAddress = [
      shipment.salesOrder.shippingStreet,
      shipment.salesOrder.shippingPostcode && shipment.salesOrder.shippingCity
        ? `${shipment.salesOrder.shippingPostcode} ${shipment.salesOrder.shippingCity}`
        : shipment.salesOrder.shippingCity,
      shipment.salesOrder.shippingStateRegion,
      shipment.salesOrder.shippingCountry,
    ].filter((value): value is string => Boolean(value && value.trim()));

    return {
      ...this.mapShipmentSummary(shipment, numberingSnapshot),
      shipToName: shipment.salesOrder.customer.name,
      shipToAddress,
      invoice: invoice
        ? {
          id: invoice.id,
            number:
              invoice.number ??
              this.numberingService.formatFromSnapshot(
                numberingSnapshot,
                'invoices',
                invoice.id,
              ),
            shipmentId: invoice.shipmentId,
            shipmentNumber:
              shipment.number ??
              this.numberingService.formatFromSnapshot(
                numberingSnapshot,
                'shipments',
                shipment.id,
              ),
            salesOrderId: shipment.salesOrderId,
            salesOrderNumber: this.numberingService.formatFromSnapshot(
              numberingSnapshot,
              'sales_orders',
              shipment.salesOrderId,
            ),
            customerId: invoice.customerId,
            customerName: invoice.customer.name,
            status: invoice.status,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate ?? null,
            paidAt: invoice.paidAt ?? null,
            totalAmount: Number(
              invoice.invoiceLines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2),
            ),
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            invoiceLines: invoice.invoiceLines.map((invoiceLine) => ({
              id: invoiceLine.id,
              invoiceId: invoiceLine.invoiceId,
              shipmentLineId: invoiceLine.shipmentLineId,
              salesOrderLineId: invoiceLine.shipmentLine.salesOrderLineId,
              itemId: invoiceLine.shipmentLine.salesOrderLine.itemId,
              itemCode: invoiceLine.shipmentLine.salesOrderLine.itemCode ?? null,
              itemName:
                invoiceLine.shipmentLine.salesOrderLine.itemName ??
                `Item ${invoiceLine.shipmentLine.salesOrderLine.itemId}`,
              quantity: invoiceLine.quantity,
              unitPrice: invoiceLine.unitPrice,
              lineTotal: invoiceLine.lineTotal,
              createdAt: invoiceLine.createdAt,
              updatedAt: invoiceLine.updatedAt,
            })),
          }
        : null,
      lines,
      history: this.buildHistoryEntries(shipment, lines, invoice, numberingSnapshot),
    };
  }

  private buildHistoryEntries(
    shipment: ShipmentRecord,
    lines: ShipmentLineAvailabilityResponseDto[],
    invoice: ShipmentInvoiceRecord | null,
    numberingSnapshot: NumberingSnapshot,
  ): ShipmentHistoryEntryResponseDto[] {
    const history: ShipmentHistoryEntryResponseDto[] = [
      {
        eventType: 'created',
        message: `${
          shipment.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'shipments',
            shipment.id,
          )
        } created from ${this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'sales_orders',
          shipment.salesOrderId,
        )}.`,
        eventDate: shipment.createdAt,
      },
    ];

    if (lines.some((line) => line.picks.length > 0)) {
      history.push({
        eventType: 'picking',
        message: `${lines.reduce((sum, line) => sum + line.pickedQuantity, 0)} units allocated across ${lines.filter((line) => line.picks.length > 0).length} line(s).`,
        eventDate: lines
          .flatMap((line) => line.picks.map((pick) => pick.updatedAt))
          .sort((left, right) => right.getTime() - left.getTime())[0] ?? shipment.updatedAt,
      });
    }

    if (shipment.shipDate) {
      history.push({
        eventType: 'shipped',
        message: `${
          shipment.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'shipments',
            shipment.id,
          )
        } shipped.`,
        eventDate: shipment.shipDate,
      });
    }

    if (shipment.deliveredAt) {
      history.push({
        eventType: 'delivered',
        message: `${
          shipment.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'shipments',
            shipment.id,
          )
        } delivered.`,
        eventDate: shipment.deliveredAt,
      });
    }

    if (invoice) {
      history.push({
        eventType: 'invoice',
        message: `${
          invoice.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'invoices',
            invoice.id,
          )
        } issued from this shipment.`,
        eventDate: invoice.issueDate,
      });
    }

    return history.sort((left, right) => right.eventDate.getTime() - left.eventDate.getTime());
  }

  private async updateSalesOrderStatusIfComplete(
    salesOrderId: number,
    nextStatus: 'shipped',
  ): Promise<void> {
    const salesOrder = await this.salesOrdersService.findOne(salesOrderId);
    const shippedByLine = await this.prisma.shipment.findMany({
      where: {
        salesOrderId,
        status: {
          in: ['shipped', 'delivered'],
        },
      },
      include: {
        shipmentLines: true,
      },
    });

    const shippedQuantityByLine = new Map<number, number>();
    for (const shipment of shippedByLine) {
      for (const line of shipment.shipmentLines) {
        shippedQuantityByLine.set(
          line.salesOrderLineId,
          (shippedQuantityByLine.get(line.salesOrderLineId) ?? 0) + line.quantity,
        );
      }
    }

    const isComplete = salesOrder.salesOrderLines.every((line) => {
      return (shippedQuantityByLine.get(line.id) ?? 0) >= line.quantity;
    });

    if (!isComplete || salesOrder.status === nextStatus || salesOrder.status === 'invoiced') {
      return;
    }

    await this.prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: nextStatus },
    });
    await this.prisma.salesOrderAudit.create({
      data: {
        salesOrderId,
        action: 'status_transition',
        fromStatus: salesOrder.status,
        toStatus: nextStatus,
        actor: 'system',
      },
    });
  }
}
