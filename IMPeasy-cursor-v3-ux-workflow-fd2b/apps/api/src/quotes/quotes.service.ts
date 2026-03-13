import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import {
  buildItemCode,
  calculateCommercialDocument,
  normalizeOptionalString,
} from '../commercial-utils';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { QuoteConversionResponseDto } from './dto/quote-conversion-response.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteDetailResponseDto } from './dto/quote-detail-response.dto';
import { QuoteLineInputDto } from './dto/quote-line-input.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';

const QUOTE_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['sent'],
  sent: ['approved', 'rejected'],
};

const QUOTE_LIST_INCLUDE = {
  customer: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  salesOrder: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.QuoteInclude;

const QUOTE_DETAIL_INCLUDE = {
  ...QUOTE_LIST_INCLUDE,
  quoteLines: {
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.QuoteInclude;

type QuoteListRecord = Prisma.QuoteGetPayload<{
  include: typeof QUOTE_LIST_INCLUDE;
}>;

type QuoteDetailRecord = Prisma.QuoteGetPayload<{
  include: typeof QUOTE_DETAIL_INCLUDE;
}>;

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesOrdersService: SalesOrdersService,
    private readonly numberingService: NumberingService,
  ) {}

  async findAll(): Promise<QuoteResponseDto[]> {
    const quotes = await this.prisma.quote.findMany({
      include: QUOTE_LIST_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    const numberingSnapshot = await this.numberingService.getSnapshot();

    return quotes.map((quote) => this.toQuoteResponse(quote, numberingSnapshot));
  }

  async findOne(id: number): Promise<QuoteDetailResponseDto> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: QUOTE_DETAIL_INCLUDE,
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toQuoteDetailResponse(quote, numberingSnapshot);
  }

  async create(payload: CreateQuoteDto): Promise<QuoteDetailResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.customerId },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${payload.customerId} not found`);
    }

    const lines = await this.buildCalculatedLines(payload.lines ?? []);
    const pricing = calculateCommercialDocument({
      lines,
      taxMode: payload.taxMode === 'inclusive' ? 'inclusive' : 'exclusive',
      documentDiscountPercent: payload.documentDiscountPercent ?? customer.defaultDocumentDiscountPercent,
    });
    const primaryContact = (customer.contacts ?? [])[0] ?? null;

    const created = await this.prisma.quote.create({
      data: {
        customerId: customer.id,
        status: 'draft',
        quoteDate: payload.quoteDate ? new Date(payload.quoteDate) : new Date(),
        validityDate: payload.validityDate ? new Date(payload.validityDate) : null,
        promisedDate: payload.promisedDate ? new Date(payload.promisedDate) : null,
        customerReference: normalizeOptionalString(payload.customerReference),
        salespersonName: normalizeOptionalString(payload.salespersonName),
        salespersonEmail: normalizeOptionalString(payload.salespersonEmail),
        paymentTerm: normalizeOptionalString(payload.paymentTerm) ?? customer.defaultPaymentTerm,
        shippingTerm:
          normalizeOptionalString(payload.shippingTerm) ?? customer.defaultShippingTerm,
        shippingMethod:
          normalizeOptionalString(payload.shippingMethod) ?? customer.defaultShippingMethod,
        taxMode: payload.taxMode === 'inclusive' ? 'inclusive' : 'exclusive',
        documentDiscountPercent:
          payload.documentDiscountPercent ?? customer.defaultDocumentDiscountPercent,
        notes: normalizeOptionalString(payload.notes),
        internalNotes: normalizeOptionalString(payload.internalNotes),
        contactName:
          normalizeOptionalString(payload.contactName) ?? primaryContact?.name ?? null,
        contactEmail:
          normalizeOptionalString(payload.contactEmail) ?? primaryContact?.email ?? null,
        contactPhone:
          normalizeOptionalString(payload.contactPhone) ?? primaryContact?.phone ?? null,
        billingStreet:
          normalizeOptionalString(payload.billingAddress?.street) ?? customer.billingStreet,
        billingCity: normalizeOptionalString(payload.billingAddress?.city) ?? customer.billingCity,
        billingPostcode:
          normalizeOptionalString(payload.billingAddress?.postcode) ?? customer.billingPostcode,
        billingStateRegion:
          normalizeOptionalString(payload.billingAddress?.stateRegion) ??
          customer.billingStateRegion,
        billingCountry:
          normalizeOptionalString(payload.billingAddress?.country) ?? customer.billingCountry,
        shippingStreet:
          normalizeOptionalString(payload.shippingAddress?.street) ?? customer.shippingStreet,
        shippingCity:
          normalizeOptionalString(payload.shippingAddress?.city) ?? customer.shippingCity,
        shippingPostcode:
          normalizeOptionalString(payload.shippingAddress?.postcode) ?? customer.shippingPostcode,
        shippingStateRegion:
          normalizeOptionalString(payload.shippingAddress?.stateRegion) ??
          customer.shippingStateRegion,
        shippingCountry:
          normalizeOptionalString(payload.shippingAddress?.country) ?? customer.shippingCountry,
        subtotalAmount: pricing.subtotalAmount,
        discountAmount: pricing.discountAmount,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        quoteLines:
          pricing.lines.length > 0
            ? {
                create: pricing.lines.map((line) => ({
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
              }
            : undefined,
      },
      include: QUOTE_DETAIL_INCLUDE,
    });

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toQuoteDetailResponse(created, numberingSnapshot);
  }

  async update(id: number, payload: UpdateQuoteDto): Promise<QuoteDetailResponseDto> {
    const existingQuote = await this.prisma.quote.findUnique({
      where: { id },
      include: QUOTE_DETAIL_INCLUDE,
    });

    if (!existingQuote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }

    const customerId = payload.customerId ?? existingQuote.customerId;
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
        : existingQuote.quoteLines.map((line) => ({
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
        (payload.taxMode ?? existingQuote.taxMode) === 'inclusive' ? 'inclusive' : 'exclusive',
      documentDiscountPercent:
        payload.documentDiscountPercent ?? existingQuote.documentDiscountPercent,
    });
    const primaryContact = (customer.contacts ?? [])[0] ?? null;

    const executeUpdate = async (transactionalPrisma: any) => {
      await transactionalPrisma.quote.update({
        where: { id },
        data: {
          customerId,
          quoteDate:
            payload.quoteDate !== undefined
              ? new Date(payload.quoteDate)
              : undefined,
          validityDate:
            payload.validityDate !== undefined
              ? payload.validityDate
                ? new Date(payload.validityDate)
                : null
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
        await transactionalPrisma.quoteLine.deleteMany({
          where: { quoteId: id },
        });

        if (pricing.lines.length > 0) {
          await transactionalPrisma.quoteLine.createMany({
            data: pricing.lines.map((line) => ({
              quoteId: id,
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

      return transactionalPrisma.quote.findUnique({
        where: { id },
        include: QUOTE_DETAIL_INCLUDE,
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
      throw new NotFoundException(`Quote ${id} not found`);
    }

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toQuoteDetailResponse(updated, numberingSnapshot);
  }

  async updateStatus(id: number, payload: UpdateQuoteStatusDto): Promise<QuoteDetailResponseDto> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: QUOTE_DETAIL_INCLUDE,
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }

    const allowedNextStatuses = QUOTE_STATUS_TRANSITIONS[quote.status] ?? [];
    if (!allowedNextStatuses.includes(payload.status)) {
      throw new BadRequestException(
        `Invalid quote status transition: ${quote.status} -> ${payload.status}`,
      );
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: payload.status },
      include: QUOTE_DETAIL_INCLUDE,
    });

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toQuoteDetailResponse(updated, numberingSnapshot);
  }

  async convertToSalesOrder(id: number): Promise<QuoteConversionResponseDto> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: QUOTE_DETAIL_INCLUDE,
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }

    if (quote.status === 'converted') {
      throw new BadRequestException(`Quote ${id} is already converted`);
    }

    if (quote.status !== 'approved') {
      throw new BadRequestException(`Only approved quotes can be converted`);
    }

    const existingSalesOrder = await this.salesOrdersService.findByQuoteId(quote.id);
    if (existingSalesOrder) {
      throw new BadRequestException(`Quote ${id} is already converted`);
    }

    const quoteLines =
      quote.quoteLines ??
      (await this.prisma.quoteLine.findMany({
        where: { quoteId: quote.id },
        orderBy: { id: 'asc' },
      }));

    const salesOrder = await this.salesOrdersService.createFromQuote({
      quoteId: quote.id,
      customerId: quote.customerId,
      promisedDate: quote.promisedDate,
      customerReference: quote.customerReference,
      salespersonName: quote.salespersonName,
      salespersonEmail: quote.salespersonEmail,
      paymentTerm: quote.paymentTerm,
      shippingTerm: quote.shippingTerm,
      shippingMethod: quote.shippingMethod,
      taxMode: quote.taxMode,
      documentDiscountPercent: quote.documentDiscountPercent,
      notes: quote.notes,
      internalNotes: quote.internalNotes,
      contactName: quote.contactName,
      contactEmail: quote.contactEmail,
      contactPhone: quote.contactPhone,
      billingStreet: quote.billingStreet,
      billingCity: quote.billingCity,
      billingPostcode: quote.billingPostcode,
      billingStateRegion: quote.billingStateRegion,
      billingCountry: quote.billingCountry,
      shippingStreet: quote.shippingStreet,
      shippingCity: quote.shippingCity,
      shippingPostcode: quote.shippingPostcode,
      shippingStateRegion: quote.shippingStateRegion,
      shippingCountry: quote.shippingCountry,
      subtotalAmount: quote.subtotalAmount,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      lines: quoteLines.map((line) => ({
        itemId: line.itemId,
        itemCode: line.itemCode ?? buildItemCode(line.itemId),
        itemName: line.itemName ?? `Item ${line.itemId}`,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit ?? 'pcs',
        unitPrice: line.unitPrice,
        lineDiscountPercent: line.lineDiscountPercent ?? 0,
        taxRate: line.taxRate ?? 0,
        deliveryDateOverride: line.deliveryDateOverride ?? null,
        lineTotal: line.lineTotal ?? 0,
        taxAmount: line.taxAmount ?? 0,
        totalAmount: line.totalAmount ?? line.lineTotal ?? 0,
      })),
    });

    const updatedQuote = await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'converted' },
      include: QUOTE_DETAIL_INCLUDE,
    });

    return {
      quote: this.toQuoteDetailResponse(
        updatedQuote,
        await this.numberingService.getSnapshot(),
      ),
      salesOrder,
    };
  }

  private async buildCalculatedLines(
    lines: QuoteLineInputDto[],
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

  private toQuoteResponse(
    quote: QuoteListRecord,
    numberingSnapshot: NumberingSnapshot,
  ): QuoteResponseDto {
    return {
      id: quote.id,
      customerId: quote.customerId,
      customerName: quote.customer?.name ?? `Customer ${quote.customerId}`,
      customerCode: quote.customer?.code ?? null,
      documentNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'quotes',
        quote.id,
      ),
      status: quote.status,
      quoteDate: quote.quoteDate ?? quote.createdAt,
      validityDate: quote.validityDate ?? null,
      promisedDate: quote.promisedDate ?? null,
      customerReference: quote.customerReference ?? null,
      salespersonName: quote.salespersonName ?? null,
      salespersonEmail: quote.salespersonEmail ?? null,
      paymentTerm: quote.paymentTerm ?? null,
      shippingTerm: quote.shippingTerm ?? null,
      shippingMethod: quote.shippingMethod ?? null,
      taxMode: quote.taxMode ?? 'exclusive',
      documentDiscountPercent: quote.documentDiscountPercent ?? 0,
      notes: quote.notes ?? null,
      internalNotes: quote.internalNotes ?? null,
      contactName: quote.contactName ?? null,
      contactEmail: quote.contactEmail ?? null,
      contactPhone: quote.contactPhone ?? null,
      billingAddress: {
        street: quote.billingStreet ?? null,
        city: quote.billingCity ?? null,
        postcode: quote.billingPostcode ?? null,
        stateRegion: quote.billingStateRegion ?? null,
        country: quote.billingCountry ?? null,
      },
      shippingAddress: {
        street: quote.shippingStreet ?? null,
        city: quote.shippingCity ?? null,
        postcode: quote.shippingPostcode ?? null,
        stateRegion: quote.shippingStateRegion ?? null,
        country: quote.shippingCountry ?? null,
      },
      subtotalAmount: quote.subtotalAmount ?? 0,
      discountAmount: quote.discountAmount ?? 0,
      taxAmount: quote.taxAmount ?? 0,
      totalAmount: quote.totalAmount ?? 0,
      linkedSalesOrderId: quote.salesOrder?.id ?? null,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }

  private toQuoteDetailResponse(
    quote: QuoteDetailRecord,
    numberingSnapshot: NumberingSnapshot,
  ): QuoteDetailResponseDto {
    return {
      ...this.toQuoteResponse(quote, numberingSnapshot),
      quoteLines: (quote.quoteLines ?? []).map((line) => ({
        id: line.id,
        quoteId: line.quoteId,
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
