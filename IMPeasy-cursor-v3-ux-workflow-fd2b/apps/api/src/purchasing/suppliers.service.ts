import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { buildItemCode } from '../commercial-utils';
import { ItemsService } from '../items/items.service';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { CreateItemVendorTermDto } from './dto/create-item-vendor-term.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ItemVendorTermResponseDto } from './dto/item-vendor-term-response.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';
import { SupplierDetailResponseDto } from './dto/supplier-detail-response.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { UpdateItemVendorTermDto } from './dto/update-item-vendor-term.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemsService: ItemsService,
    private readonly numberingService: NumberingService,
  ) {}

  async findAll(): Promise<SupplierResponseDto[]> {
    const suppliers = await this.prisma.supplier.findMany({
      orderBy: [{ code: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });

    return suppliers.map((supplier) => ({
      id: supplier.id,
      code: supplier.code ?? null,
      name: supplier.name,
      email: supplier.email ?? null,
      phone: supplier.phone ?? null,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }));
  }

  async findOne(id: number): Promise<SupplierDetailResponseDto> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        itemVendorTerms: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
          orderBy: [{ isPreferred: 'desc' }, { updatedAt: 'desc' }],
        },
        purchaseOrders: {
          orderBy: [{ orderDate: 'desc' }, { id: 'desc' }],
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }

    const supplierItemVendorTerms = supplier.itemVendorTerms ?? [];
    const supplierPurchaseOrders = supplier.purchaseOrders ?? [];
    const numberingSnapshot = await this.numberingService.getSnapshot();

    const purchaseOrderLines = supplierPurchaseOrders.length
      ? await this.prisma.purchaseOrderLine.findMany({
          where: {
            purchaseOrderId: {
              in: supplierPurchaseOrders.map((purchaseOrder) => purchaseOrder.id),
            },
          },
          select: {
            id: true,
            purchaseOrderId: true,
            quantity: true,
          },
        })
      : [];

    const receivedByLine = await this.getReceivedByLine(
      purchaseOrderLines.map((line) => line.id),
    );
    const linesByOrder = new Map<number, { ordered: number; received: number }>();

    for (const line of purchaseOrderLines) {
      const current = linesByOrder.get(line.purchaseOrderId) ?? { ordered: 0, received: 0 };
      current.ordered += line.quantity;
      current.received += receivedByLine.get(line.id) ?? 0;
      linesByOrder.set(line.purchaseOrderId, current);
    }

    return {
      id: supplier.id,
      code: supplier.code ?? null,
      name: supplier.name,
      email: supplier.email ?? null,
      phone: supplier.phone ?? null,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      itemVendorTerms: supplierItemVendorTerms.map((term) => this.toItemVendorTermResponse(term)),
      purchaseOrders: supplierPurchaseOrders.map((purchaseOrder) =>
        this.toPurchaseOrderResponse(
          purchaseOrder,
          linesByOrder.get(purchaseOrder.id)?.ordered ?? 0,
          linesByOrder.get(purchaseOrder.id)?.received ?? 0,
          supplier,
          numberingSnapshot,
        ),
      ),
    };
  }

  async create(payload: CreateSupplierDto): Promise<SupplierResponseDto> {
    const created = await this.prisma.supplier.create({
      data: {
        code: payload.code?.trim() || null,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        isActive: true,
      },
    });

    return {
      id: created.id,
      code: created.code ?? null,
      name: created.name,
      email: created.email ?? null,
      phone: created.phone ?? null,
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(id: number, payload: UpdateSupplierDto): Promise<SupplierResponseDto> {
    await this.ensureSupplierExists(id);

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        code: payload.code === undefined ? undefined : payload.code?.trim() || null,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        isActive: payload.isActive,
      },
    });

    return {
      id: updated.id,
      code: updated.code ?? null,
      name: updated.name,
      email: updated.email ?? null,
      phone: updated.phone ?? null,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async listItemVendorTermsBySupplier(supplierId: number): Promise<ItemVendorTermResponseDto[]> {
    await this.ensureSupplierExists(supplierId);

    const terms = await this.prisma.itemVendorTerm.findMany({
      where: { supplierId },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [{ isPreferred: 'desc' }, { updatedAt: 'desc' }],
    });

    return terms.map((term) => this.toItemVendorTermResponse(term));
  }

  async listItemVendorTermsByItem(itemId: number): Promise<ItemVendorTermResponseDto[]> {
    await this.itemsService.findOne(itemId);

    const terms = await this.prisma.itemVendorTerm.findMany({
      where: { itemId },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [{ isPreferred: 'desc' }, { updatedAt: 'desc' }],
    });

    return terms.map((term) => this.toItemVendorTermResponse(term));
  }

  async createItemVendorTerm(
    supplierId: number,
    payload: CreateItemVendorTermDto,
  ): Promise<ItemVendorTermResponseDto> {
    await this.ensureSupplierExists(supplierId);
    await this.itemsService.findOne(payload.itemId);

    const existing = await this.prisma.itemVendorTerm.findUnique({
      where: {
        itemId_supplierId: {
          itemId: payload.itemId,
          supplierId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Item ${payload.itemId} already has purchasing terms for supplier ${supplierId}`,
      );
    }

    const created = await this.prisma.itemVendorTerm.create({
      data: {
        itemId: payload.itemId,
        supplierId,
        vendorItemCode: payload.vendorItemCode?.trim() || null,
        leadTimeDays: payload.leadTimeDays ?? 0,
        unitPrice: payload.unitPrice ?? 0,
        minimumQuantity: payload.minimumQuantity ?? 1,
        isPreferred: payload.isPreferred ?? false,
        notes: payload.notes?.trim() || null,
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (payload.isPreferred) {
      await this.prisma.item.update({
        where: { id: payload.itemId },
        data: {
          preferredVendorId: supplierId,
        },
      });
    }

    return this.toItemVendorTermResponse(created);
  }

  async updateItemVendorTerm(
    supplierId: number,
    termId: number,
    payload: UpdateItemVendorTermDto,
  ): Promise<ItemVendorTermResponseDto> {
    await this.ensureSupplierExists(supplierId);

    const existing = await this.prisma.itemVendorTerm.findUnique({
      where: { id: termId },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException(
        `Item vendor term ${termId} not found for supplier ${supplierId}`,
      );
    }

    if (payload.itemId !== undefined && payload.itemId !== existing.itemId) {
      await this.itemsService.findOne(payload.itemId);
    }

    const updated = await this.prisma.itemVendorTerm.update({
      where: { id: termId },
      data: {
        itemId: payload.itemId,
        vendorItemCode:
          payload.vendorItemCode === undefined ? undefined : payload.vendorItemCode?.trim() || null,
        leadTimeDays: payload.leadTimeDays,
        unitPrice: payload.unitPrice,
        minimumQuantity: payload.minimumQuantity,
        isPreferred: payload.isPreferred,
        notes: payload.notes === undefined ? undefined : payload.notes?.trim() || null,
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (payload.isPreferred) {
      await this.prisma.item.update({
        where: { id: updated.itemId },
        data: {
          preferredVendorId: supplierId,
        },
      });
    }

    return this.toItemVendorTermResponse(updated);
  }

  async ensureSupplierExists(id: number): Promise<void> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }
  }

  private async getReceivedByLine(lineIds: number[]): Promise<Map<number, number>> {
    if (lineIds.length === 0) {
      return new Map<number, number>();
    }

    const receipts = await this.prisma.inventoryTransaction.findMany({
      where: {
        purchaseOrderLineId: {
          in: lineIds,
        },
        transactionType: 'purchase_receipt',
      },
      select: {
        purchaseOrderLineId: true,
        quantity: true,
      },
    });

    const receivedByLine = new Map<number, number>();
    for (const receipt of receipts) {
      if (!receipt.purchaseOrderLineId) {
        continue;
      }

      receivedByLine.set(
        receipt.purchaseOrderLineId,
        (receivedByLine.get(receipt.purchaseOrderLineId) ?? 0) + receipt.quantity,
      );
    }

    return receivedByLine;
  }

  private toItemVendorTermResponse(term: {
    id: number;
    itemId: number;
    supplierId: number;
    vendorItemCode: string | null;
    leadTimeDays: number;
    unitPrice: number;
    minimumQuantity: number;
    isPreferred: boolean;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    item: {
      id: number;
      code: string | null;
      name: string;
    };
    supplier: {
      id: number;
      code: string | null;
      name: string;
    };
  }): ItemVendorTermResponseDto {
    return {
      id: term.id,
      itemId: term.itemId,
      itemCode: term.item.code ?? buildItemCode(term.itemId),
      itemName: term.item.name,
      supplierId: term.supplierId,
      supplierCode: term.supplier.code ?? null,
      supplierName: term.supplier.name,
      vendorItemCode: term.vendorItemCode ?? null,
      leadTimeDays: term.leadTimeDays,
      unitPrice: term.unitPrice,
      minimumQuantity: term.minimumQuantity,
      isPreferred: term.isPreferred,
      notes: term.notes ?? null,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
    };
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
    },
    orderedQuantity: number,
    receivedQuantity: number,
    supplier: {
      id: number;
      code: string | null;
      name: string;
    },
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
      supplierCode: supplier.code ?? null,
      supplierName: supplier.name,
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
}
