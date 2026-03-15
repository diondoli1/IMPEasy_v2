import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import {
  buildItemCode,
  calculateCommercialDocument,
  normalizeOptionalString,
} from '../commercial-utils';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { SalesOrderAuditResponseDto } from './dto/sales-order-audit-response.dto';
import { SalesOrderDetailResponseDto } from './dto/sales-order-detail-response.dto';
import { SalesOrderLineInputDto } from './dto/sales-order-line-input.dto';
import { SalesOrderResponseDto } from './dto/sales-order-response.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';

export type SalesOrderLineSeed = {
  itemId: number;
  itemCode?: string | null;
  itemName?: string | null;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  lineDiscountPercent?: number | null;
  taxRate?: number | null;
  deliveryDateOverride?: Date | null;
  lineTotal: number;
  taxAmount: number;
  totalAmount: number;
};

type CreateSalesOrderFromQuoteInput = {
  quoteId: number;
  customerId: number;
  promisedDate: Date | null;
  customerReference: string | null;
  salespersonName: string | null;
  salespersonEmail: string | null;
  paymentTerm: string | null;
  shippingTerm: string | null;
  shippingMethod: string | null;
  taxMode: string;
  documentDiscountPercent: number;
  notes: string | null;
  internalNotes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  billingStreet: string | null;
  billingCity: string | null;
  billingPostcode: string | null;
  billingStateRegion: string | null;
  billingCountry: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingPostcode: string | null;
  shippingStateRegion: string | null;
  shippingCountry: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: SalesOrderLineSeed[];
};

const SALES_ORDER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['confirmed'],
  confirmed: ['released'],
  released: ['in_production'],
  in_production: ['shipped'],
  shipped: ['invoiced'],
  invoiced: ['closed'],
};

const SALES_ORDER_LIST_INCLUDE = {
  customer: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} satisfies Prisma.SalesOrderInclude;

const SALES_ORDER_DETAIL_INCLUDE = {
  ...SALES_ORDER_LIST_INCLUDE,
  salesOrderLines: {
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.SalesOrderInclude;

type SalesOrderListRecord = Prisma.SalesOrderGetPayload<{
  include: typeof SALES_ORDER_LIST_INCLUDE;
}>;

type SalesOrderDetailRecord = Prisma.SalesOrderGetPayload<{
  include: typeof SALES_ORDER_DETAIL_INCLUDE;
}>;

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberingService: NumberingService,
  ) {}

  async findAll(): Promise<SalesOrderResponseDto[]> {
    const salesOrders = await this.prisma.salesOrder.findMany({
      include: SALES_ORDER_LIST_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    const numberingSnapshot = await this.numberingService.getSnapshot();

    return salesOrders.map((salesOrder) =>
      this.toSalesOrderResponse(salesOrder, numberingSnapshot),
    );
  }

  async findOne(id: number): Promise<SalesOrderDetailResponseDto> {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: SALES_ORDER_DETAIL_INCLUDE,
    });

    if (!salesOrder) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toSalesOrderDetailResponse(salesOrder, numberingSnapshot);
  }

  async findByQuoteId(quoteId: number): Promise<SalesOrderResponseDto | null> {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { quoteId },
      include: SALES_ORDER_LIST_INCLUDE,
    });

    if (!salesOrder) {
      return null;
    }

    return this.toSalesOrderResponse(
      salesOrder,
      await this.numberingService.getSnapshot(),
    );
  }

  async update(id: number, payload: UpdateSalesOrderDto): Promise<SalesOrderDetailResponseDto> {
    const existingSalesOrder = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: SALES_ORDER_DETAIL_INCLUDE,
    });

    if (!existingSalesOrder) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }

    const customerId = payload.customerId ?? existingSalesOrder.customerId;
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    const lineInputs =
      payload.lines !== undefined
        ? payload.lines
        : existingSalesOrder.salesOrderLines.map((line) => ({
            itemId: line.itemId,
            description: line.description ?? undefined,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            lineDiscountPercent: line.lineDiscountPercent,
            taxRate: line.taxRate,
            deliveryDateOverride: line.deliveryDateOverride?.toISOString(),
          }));
    const pricing = calculateCommercialDocument({
      lines: await this.buildCalculatedLines(lineInputs),
      taxMode:
        (payload.taxMode ?? existingSalesOrder.taxMode) === 'inclusive'
          ? 'inclusive'
          : 'exclusive',
      documentDiscountPercent:
        payload.documentDiscountPercent ?? existingSalesOrder.documentDiscountPercent,
    });
    const primaryContact = (customer.contacts ?? [])[0] ?? null;

    const executeUpdate = async (transactionalPrisma: any) => {
      await transactionalPrisma.salesOrder.update({
        where: { id },
        data: {
          customerId,
          orderDate:
            payload.orderDate !== undefined
              ? new Date(payload.orderDate)
              : undefined,
          promisedDate:
            payload.promisedDate !== undefined
              ? payload.promisedDate
                ? new Date(payload.promisedDate)
                : null
              : undefined,
          customerReference:
            payload.customerReference !== undefined
              ? normalizeOptionalString(payload.customerReference)
              : undefined,
          salespersonName:
            payload.salespersonName !== undefined
              ? normalizeOptionalString(payload.salespersonName)
              : undefined,
          salespersonEmail:
            payload.salespersonEmail !== undefined
              ? normalizeOptionalString(payload.salespersonEmail)
              : undefined,
          paymentTerm:
            payload.paymentTerm !== undefined
              ? normalizeOptionalString(payload.paymentTerm)
              : undefined,
          shippingTerm:
            payload.shippingTerm !== undefined
              ? normalizeOptionalString(payload.shippingTerm)
              : undefined,
          shippingMethod:
            payload.shippingMethod !== undefined
              ? normalizeOptionalString(payload.shippingMethod)
              : undefined,
          taxMode: payload.taxMode,
          documentDiscountPercent:
            payload.documentDiscountPercent !== undefined
              ? payload.documentDiscountPercent
              : undefined,
          notes:
            payload.notes !== undefined ? normalizeOptionalString(payload.notes) : undefined,
          internalNotes:
            payload.internalNotes !== undefined
              ? normalizeOptionalString(payload.internalNotes)
              : undefined,
          contactName:
            payload.contactName !== undefined
              ? normalizeOptionalString(payload.contactName)
              : payload.customerId !== undefined
                ? primaryContact?.name ?? null
                : undefined,
          contactEmail:
            payload.contactEmail !== undefined
              ? normalizeOptionalString(payload.contactEmail)
              : payload.customerId !== undefined
                ? primaryContact?.email ?? null
                : undefined,
          contactPhone:
            payload.contactPhone !== undefined
              ? normalizeOptionalString(payload.contactPhone)
              : payload.customerId !== undefined
                ? primaryContact?.phone ?? null
                : undefined,
          billingStreet:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.street)
              : payload.customerId !== undefined
                ? customer.billingStreet
                : undefined,
          billingCity:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.city)
              : payload.customerId !== undefined
                ? customer.billingCity
                : undefined,
          billingPostcode:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.postcode)
              : payload.customerId !== undefined
                ? customer.billingPostcode
                : undefined,
          billingStateRegion:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.stateRegion)
              : payload.customerId !== undefined
                ? customer.billingStateRegion
                : undefined,
          billingCountry:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.country)
              : payload.customerId !== undefined
                ? customer.billingCountry
                : undefined,
          shippingStreet:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.street)
              : payload.customerId !== undefined
                ? customer.shippingStreet
                : undefined,
          shippingCity:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.city)
              : payload.customerId !== undefined
                ? customer.shippingCity
                : undefined,
          shippingPostcode:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.postcode)
              : payload.customerId !== undefined
                ? customer.shippingPostcode
                : undefined,
          shippingStateRegion:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.stateRegion)
              : payload.customerId !== undefined
                ? customer.shippingStateRegion
                : undefined,
          shippingCountry:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.country)
              : payload.customerId !== undefined
                ? customer.shippingCountry
                : undefined,
          subtotalAmount: pricing.subtotalAmount,
          discountAmount: pricing.discountAmount,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
        },
      });

      if (payload.lines !== undefined) {
        await transactionalPrisma.salesOrderLine.deleteMany({
          where: { salesOrderId: id },
        });

        if (pricing.lines.length > 0) {
          await transactionalPrisma.salesOrderLine.createMany({
            data: pricing.lines.map((line) => ({
              salesOrderId: id,
              itemId: line.itemId,
              itemCode: line.itemCode,
              itemName: line.itemName,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: line.unitPrice,
              lineDiscountPercent: line.lineDiscountPercent,
              taxRate: line.taxRate,
              deliveryDateOverride: line.deliveryDateOverride ?? null,
              lineTotal: line.lineTotal,
              taxAmount: line.taxAmount,
              totalAmount: line.totalAmount,
            })),
          });
        }
      }

      return transactionalPrisma.salesOrder.findUnique({
        where: { id },
        include: SALES_ORDER_DETAIL_INCLUDE,
      });
    };
    const prismaWithOptionalTransaction = this.prisma as typeof this.prisma & {
      $transaction?: unknown;
    };
    const transaction = prismaWithOptionalTransaction.$transaction as
      | ((callback: (prisma: any) => Promise<any>) => Promise<any>)
      | undefined;
    const updated =
      typeof transaction === 'function'
        ? await transaction.call(this.prisma, executeUpdate)
        : await executeUpdate(this.prisma);

    if (!updated) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toSalesOrderDetailResponse(updated, numberingSnapshot);
  }

  async updateStatus(id: number, payload: UpdateSalesOrderStatusDto): Promise<SalesOrderResponseDto> {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: SALES_ORDER_LIST_INCLUDE,
    });

    if (!salesOrder) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }

    const allowedNextStatuses = SALES_ORDER_STATUS_TRANSITIONS[salesOrder.status] ?? [];
    if (!allowedNextStatuses.includes(payload.status)) {
      throw new BadRequestException(
        `Invalid sales order status transition: ${salesOrder.status} -> ${payload.status}`,
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: payload.status },
      include: SALES_ORDER_LIST_INCLUDE,
    });

    await this.prisma.salesOrderAudit.create({
      data: {
        salesOrderId: id,
        action: 'status_transition',
        fromStatus: salesOrder.status,
        toStatus: payload.status,
        actor: 'system',
      },
    });

    return this.toSalesOrderResponse(
      updated,
      await this.numberingService.getSnapshot(),
    );
  }

  async listAuditTrail(id: number): Promise<SalesOrderAuditResponseDto[]> {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id },
    });

    if (!salesOrder) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }

    return this.prisma.salesOrderAudit.findMany({
      where: { salesOrderId: id },
      orderBy: { id: 'asc' },
    });
  }

  async createFromQuote(input: CreateSalesOrderFromQuoteInput): Promise<SalesOrderResponseDto> {
    const created = await this.prisma.salesOrder.create({
      data: {
        quoteId: input.quoteId,
        customerId: input.customerId,
        status: 'draft',
        orderDate: new Date(),
        promisedDate: input.promisedDate,
        customerReference: input.customerReference,
        salespersonName: input.salespersonName,
        salespersonEmail: input.salespersonEmail,
        paymentTerm: input.paymentTerm,
        shippingTerm: input.shippingTerm,
        shippingMethod: input.shippingMethod,
        taxMode: input.taxMode,
        documentDiscountPercent: input.documentDiscountPercent,
        notes: input.notes,
        internalNotes: input.internalNotes,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        billingStreet: input.billingStreet,
        billingCity: input.billingCity,
        billingPostcode: input.billingPostcode,
        billingStateRegion: input.billingStateRegion,
        billingCountry: input.billingCountry,
        shippingStreet: input.shippingStreet,
        shippingCity: input.shippingCity,
        shippingPostcode: input.shippingPostcode,
        shippingStateRegion: input.shippingStateRegion,
        shippingCountry: input.shippingCountry,
        subtotalAmount: input.subtotalAmount,
        discountAmount: input.discountAmount,
        taxAmount: input.taxAmount,
        totalAmount: input.totalAmount,
        salesOrderLines: {
          create: input.lines.map((line) => ({
            itemId: line.itemId,
            itemCode: line.itemCode,
            itemName: line.itemName,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit ?? 'pcs',
            unitPrice: line.unitPrice,
            lineDiscountPercent: line.lineDiscountPercent ?? 0,
            taxRate: line.taxRate ?? 0,
            deliveryDateOverride: line.deliveryDateOverride ?? null,
            lineTotal: line.lineTotal,
            taxAmount: line.taxAmount,
            totalAmount: line.totalAmount,
          })),
        },
        salesOrderAudits: {
          create: {
            action: 'created_from_quote',
            fromStatus: null,
            toStatus: 'draft',
            actor: 'system',
          },
        },
      },
      include: SALES_ORDER_LIST_INCLUDE,
    });

    return this.toSalesOrderResponse(
      created,
      await this.numberingService.getSnapshot(),
    );
  }

  private async buildCalculatedLines(
    lines: SalesOrderLineInputDto[],
  ): Promise<
    Array<{
      itemId: number;
      itemCode: string;
      itemName: string;
      description: string | null;
      quantity: number;
      unit: string | null;
      unitPrice: number;
      lineDiscountPercent: number;
      taxRate: number;
      deliveryDateOverride: Date | null;
    }>
  > {
    const itemIds = Array.from(new Set(lines.map((line) => line.itemId)));
    if (itemIds.length === 0) {
      return [];
    }

    const items = await this.prisma.item.findMany({
      where: {
        id: {
          in: itemIds,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    const itemsById = new Map(items.map((item) => [item.id, item]));

    return lines.map((line) => {
      const item = itemsById.get(line.itemId);
      if (!item) {
        throw new NotFoundException(`Item ${line.itemId} not found`);
      }

      return {
        itemId: item.id,
        itemCode: buildItemCode(item.id),
        itemName: item.name,
        description: normalizeOptionalString(line.description) ?? item.description ?? item.name,
        quantity: line.quantity,
        unit: normalizeOptionalString(line.unit) ?? 'pcs',
        unitPrice: line.unitPrice,
        lineDiscountPercent: line.lineDiscountPercent ?? 0,
        taxRate: line.taxRate ?? 0,
        deliveryDateOverride: line.deliveryDateOverride
          ? new Date(line.deliveryDateOverride)
          : null,
      };
    });
  }

  private toSalesOrderResponse(
    salesOrder: SalesOrderListRecord,
    numberingSnapshot: NumberingSnapshot,
  ): SalesOrderResponseDto {
    return {
      id: salesOrder.id,
      quoteId: salesOrder.quoteId,
      customerId: salesOrder.customerId,
      customerName: salesOrder.customer?.name ?? `Customer ${salesOrder.customerId}`,
      customerCode: salesOrder.customer?.code ?? null,
      documentNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'sales_orders',
        salesOrder.id,
      ),
      status: salesOrder.status,
      orderDate: salesOrder.orderDate ?? salesOrder.createdAt,
      promisedDate: salesOrder.promisedDate ?? null,
      customerReference: salesOrder.customerReference ?? null,
      salespersonName: salesOrder.salespersonName ?? null,
      salespersonEmail: salesOrder.salespersonEmail ?? null,
      paymentTerm: salesOrder.paymentTerm ?? null,
      shippingTerm: salesOrder.shippingTerm ?? null,
      shippingMethod: salesOrder.shippingMethod ?? null,
      taxMode: salesOrder.taxMode ?? 'exclusive',
      documentDiscountPercent: salesOrder.documentDiscountPercent ?? 0,
      notes: salesOrder.notes ?? null,
      internalNotes: salesOrder.internalNotes ?? null,
      contactName: salesOrder.contactName ?? null,
      contactEmail: salesOrder.contactEmail ?? null,
      contactPhone: salesOrder.contactPhone ?? null,
      billingAddress: {
        street: salesOrder.billingStreet ?? null,
        city: salesOrder.billingCity ?? null,
        postcode: salesOrder.billingPostcode ?? null,
        stateRegion: salesOrder.billingStateRegion ?? null,
        country: salesOrder.billingCountry ?? null,
      },
      shippingAddress: {
        street: salesOrder.shippingStreet ?? null,
        city: salesOrder.shippingCity ?? null,
        postcode: salesOrder.shippingPostcode ?? null,
        stateRegion: salesOrder.shippingStateRegion ?? null,
        country: salesOrder.shippingCountry ?? null,
      },
      subtotalAmount: salesOrder.subtotalAmount ?? 0,
      discountAmount: salesOrder.discountAmount ?? 0,
      taxAmount: salesOrder.taxAmount ?? 0,
      totalAmount: salesOrder.totalAmount ?? 0,
      createdAt: salesOrder.createdAt,
      updatedAt: salesOrder.updatedAt,
    };
  }

  private toSalesOrderDetailResponse(
    salesOrder: SalesOrderDetailRecord,
    numberingSnapshot: NumberingSnapshot,
  ): SalesOrderDetailResponseDto {
    return {
      ...this.toSalesOrderResponse(salesOrder, numberingSnapshot),
      salesOrderLines: (salesOrder.salesOrderLines ?? []).map((line) => ({
        id: line.id,
        salesOrderId: line.salesOrderId,
        itemId: line.itemId,
        itemCode: line.itemCode ?? buildItemCode(line.itemId),
        itemName: line.itemName ?? `Item ${line.itemId}`,
        description: line.description ?? null,
        quantity: line.quantity,
        unit: line.unit ?? 'pcs',
        unitPrice: line.unitPrice,
        lineDiscountPercent: line.lineDiscountPercent ?? 0,
        taxRate: line.taxRate ?? 0,
        deliveryDateOverride: line.deliveryDateOverride ?? null,
        lineTotal: line.lineTotal ?? 0,
        taxAmount: line.taxAmount ?? 0,
        totalAmount: line.totalAmount ?? line.lineTotal ?? 0,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
      })),
    };
  }
}
