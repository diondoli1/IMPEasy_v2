import { Injectable, NotFoundException } from '@nestjs/common';

import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import {
  PurchaseOrderDetailResponseDto,
  PurchaseOrderHistoryEntryResponseDto,
} from './dto/purchase-order-detail-response.dto';
import { PurchaseOrderLineResponseDto } from './dto/purchase-order-line-response.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';
import { PurchaseReceiptResponseDto } from './dto/purchase-receipt-response.dto';
import { SuppliersService } from './suppliers.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly suppliersService: SuppliersService,
    private readonly numberingService: NumberingService,
  ) {}

  async findAll(): Promise<PurchaseOrderResponseDto[]> {
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        purchaseOrderLines: {
          select: {
            id: true,
            quantity: true,
          },
        },
      },
      orderBy: [{ orderDate: 'desc' }, { id: 'desc' }],
    });

    const lineIds = purchaseOrders.flatMap((purchaseOrder) =>
      purchaseOrder.purchaseOrderLines.map((line) => line.id),
    );
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const receivedByLine = await this.inventoryService.getReceivedQuantitiesByPurchaseOrderLineIds(
      lineIds,
    );

    return purchaseOrders.map((purchaseOrder) => {
      const orderedQuantity = purchaseOrder.purchaseOrderLines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      );
      const receivedQuantity = purchaseOrder.purchaseOrderLines.reduce(
        (sum, line) => sum + (receivedByLine.get(line.id) ?? 0),
        0,
      );

      return this.toPurchaseOrderResponse(
        purchaseOrder,
        orderedQuantity,
        receivedQuantity,
        numberingSnapshot,
      );
    });
  }

  async findOne(id: number): Promise<PurchaseOrderDetailResponseDto> {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        purchaseOrderLines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
          orderBy: [{ id: 'asc' }],
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }

    const lineIds = purchaseOrder.purchaseOrderLines.map((line) => line.id);
    const [receivedByLine, receipts] = await Promise.all([
      this.inventoryService.getReceivedQuantitiesByPurchaseOrderLineIds(lineIds),
      this.listReceipts(lineIds),
    ]);
    const numberingSnapshot = await this.numberingService.getSnapshot();

    const lines = purchaseOrder.purchaseOrderLines.map((line) =>
      this.toPurchaseOrderLineResponse(line, receivedByLine.get(line.id) ?? 0),
    );
    const orderedQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    const receivedQuantity = lines.reduce((sum, line) => sum + line.receivedQuantity, 0);
    const history = this.buildHistoryEntries(purchaseOrder, receipts, numberingSnapshot);

    return {
      id: purchaseOrder.id,
      number:
        purchaseOrder.number ??
        this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'purchase_orders',
          purchaseOrder.id,
        ),
      supplierId: purchaseOrder.supplierId,
      supplierCode: purchaseOrder.supplier.code ?? null,
      supplierName: purchaseOrder.supplier.name,
      status: purchaseOrder.status,
      supplierReference: purchaseOrder.supplierReference ?? null,
      orderDate: purchaseOrder.orderDate,
      expectedDate: purchaseOrder.expectedDate ?? null,
      buyer: purchaseOrder.buyer ?? null,
      currency: purchaseOrder.currency,
      paymentTerm: purchaseOrder.paymentTerm ?? null,
      notes: purchaseOrder.notes ?? null,
      openQuantity: Math.max(orderedQuantity - receivedQuantity, 0),
      receivedQuantity,
      lines,
      receipts,
      history,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
    };
  }

  async create(payload: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    await this.suppliersService.ensureSupplierExists(payload.supplierId);
    const numberingSnapshot = await this.numberingService.getSnapshot();

    const created = await this.prisma.purchaseOrder.create({
      data: {
        supplierId: payload.supplierId,
        status: 'draft',
        supplierReference: payload.supplierReference?.trim() || null,
        orderDate: payload.orderDate ? new Date(payload.orderDate) : new Date(),
        expectedDate: payload.expectedDate ? new Date(payload.expectedDate) : null,
        buyer: payload.buyer?.trim() || null,
        currency: payload.currency?.trim() || 'EUR',
        paymentTerm: payload.paymentTerm?.trim() || null,
        notes: payload.notes?.trim() || null,
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    const purchaseOrder = created.number
      ? created
      : await this.prisma.purchaseOrder.update({
          where: { id: created.id },
          data: {
            number: this.numberingService.formatFromSnapshot(
              numberingSnapshot,
              'purchase_orders',
              created.id,
            ),
          },
          include: {
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });

    return this.toPurchaseOrderResponse(purchaseOrder, 0, 0, numberingSnapshot);
  }

  async refreshStatus(purchaseOrderId: number): Promise<void> {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        purchaseOrderLines: {
          select: {
            id: true,
            quantity: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order ${purchaseOrderId} not found`);
    }

    const receivedByLine = await this.inventoryService.getReceivedQuantitiesByPurchaseOrderLineIds(
      purchaseOrder.purchaseOrderLines.map((line) => line.id),
    );
    const orderedQuantity = purchaseOrder.purchaseOrderLines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    );
    const receivedQuantity = purchaseOrder.purchaseOrderLines.reduce(
      (sum, line) => sum + (receivedByLine.get(line.id) ?? 0),
      0,
    );

    const status =
      purchaseOrder.purchaseOrderLines.length === 0
        ? 'draft'
        : receivedQuantity === 0
          ? 'open'
          : receivedQuantity < orderedQuantity
            ? 'partial'
            : 'received';

    await this.prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status },
    });
  }

  private async listReceipts(lineIds: number[]): Promise<PurchaseReceiptResponseDto[]> {
    if (lineIds.length === 0) {
      return [];
    }

    const receipts = await this.prisma.inventoryTransaction.findMany({
      where: {
        purchaseOrderLineId: {
          in: lineIds,
        },
        transactionType: 'purchase_receipt',
      },
      include: {
        stockLot: {
          select: {
            id: true,
            lotNumber: true,
          },
        },
      },
      orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
    });

    return receipts.map((receipt) => ({
      id: receipt.id,
      purchaseOrderLineId: receipt.purchaseOrderLineId ?? 0,
      stockLotId: receipt.stockLotId ?? null,
      lotNumber: receipt.stockLot?.lotNumber ?? null,
      quantity: receipt.quantity,
      receiptDate: receipt.transactionDate,
      notes: receipt.notes ?? null,
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
    }));
  }

  private buildHistoryEntries(
    purchaseOrder: {
      id: number;
      number: string | null;
      createdAt: Date;
      supplier: {
        name: string;
      };
    },
    receipts: PurchaseReceiptResponseDto[],
    numberingSnapshot: NumberingSnapshot,
  ): PurchaseOrderHistoryEntryResponseDto[] {
    const history: PurchaseOrderHistoryEntryResponseDto[] = [
      {
        eventType: 'created',
        message: `${
          purchaseOrder.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'purchase_orders',
            purchaseOrder.id,
          )
        } created for ${purchaseOrder.supplier.name}.`,
        eventDate: purchaseOrder.createdAt,
      },
    ];

    for (const receipt of receipts) {
      history.push({
        eventType: 'receipt',
        message: `Received ${receipt.quantity} into ${receipt.lotNumber ?? 'a lot'} for line ${receipt.purchaseOrderLineId}.`,
        eventDate: receipt.receiptDate,
      });
    }

    return history.sort((left, right) => right.eventDate.getTime() - left.eventDate.getTime());
  }

  private toPurchaseOrderResponse(
    purchaseOrder: {
      id: number;
      number: string | null;
      supplierId: number;
      status: string;
      supplierReference: string | null;
      orderDate: Date;
      expectedDate: Date | null;
      buyer: string | null;
      currency: string;
      paymentTerm: string | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      supplier: {
        id: number;
        code: string | null;
        name: string;
      };
    },
    orderedQuantity: number,
    receivedQuantity: number,
    numberingSnapshot: NumberingSnapshot,
  ): PurchaseOrderResponseDto {
    return {
      id: purchaseOrder.id,
      number:
        purchaseOrder.number ??
        this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'purchase_orders',
          purchaseOrder.id,
        ),
      supplierId: purchaseOrder.supplierId,
      supplierCode: purchaseOrder.supplier.code ?? null,
      supplierName: purchaseOrder.supplier.name,
      status: purchaseOrder.status,
      supplierReference: purchaseOrder.supplierReference ?? null,
      orderDate: purchaseOrder.orderDate,
      expectedDate: purchaseOrder.expectedDate ?? null,
      buyer: purchaseOrder.buyer ?? null,
      currency: purchaseOrder.currency,
      paymentTerm: purchaseOrder.paymentTerm ?? null,
      openQuantity: Math.max(orderedQuantity - receivedQuantity, 0),
      receivedQuantity,
      notes: purchaseOrder.notes ?? null,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
    };
  }

  private toPurchaseOrderLineResponse(
    line: {
      id: number;
      purchaseOrderId: number;
      itemId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      createdAt: Date;
      updatedAt: Date;
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
