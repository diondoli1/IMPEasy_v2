import { Injectable, NotFoundException } from '@nestjs/common';

import {
  buildItemCode,
  calculateCommercialDocument,
  normalizeOptionalString,
} from '../commercial-utils';
import { ItemsService } from '../items/items.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteLineDto } from './dto/create-quote-line.dto';
import { QuoteLineResponseDto } from './dto/quote-line-response.dto';

@Injectable()
export class QuoteLinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemsService: ItemsService,
  ) {}

  async listByQuote(quoteId: number): Promise<QuoteLineResponseDto[]> {
    await this.ensureQuoteExists(quoteId);

    return this.prisma.quoteLine.findMany({
      where: { quoteId },
      orderBy: { id: 'asc' },
    });
  }

  async create(quoteId: number, payload: CreateQuoteLineDto): Promise<QuoteLineResponseDto> {
    const quote = await this.ensureQuoteExists(quoteId);
    const item = await this.itemsService.findOne(payload.itemId);

    const pricing = calculateCommercialDocument({
      lines: [
        {
          itemId: payload.itemId,
          itemCode: buildItemCode(payload.itemId),
          itemName: item.name,
          description: normalizeOptionalString(payload.description) ?? item.description ?? item.name,
          quantity: payload.quantity,
          unit: normalizeOptionalString(payload.unit) ?? 'pcs',
          unitPrice: payload.unitPrice,
          lineDiscountPercent: payload.lineDiscountPercent ?? 0,
          taxRate: payload.taxRate ?? 0,
          deliveryDateOverride: payload.deliveryDateOverride
            ? new Date(payload.deliveryDateOverride)
            : null,
        },
      ],
      taxMode: quote.taxMode === 'inclusive' ? 'inclusive' : 'exclusive',
      documentDiscountPercent: 0,
    });
    const line = pricing.lines[0];

    const created = await this.prisma.quoteLine.create({
      data: {
        quoteId,
        itemId: payload.itemId,
        itemCode: line.itemCode,
        itemName: line.itemName,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        lineDiscountPercent: line.lineDiscountPercent,
        taxRate: line.taxRate,
        deliveryDateOverride: line.deliveryDateOverride,
        lineTotal: line.lineTotal,
        taxAmount: line.taxAmount,
        totalAmount: line.totalAmount,
      },
    });

    await this.recalculateQuoteTotals(quoteId);

    return created;
  }

  private async ensureQuoteExists(quoteId: number) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });

    if (!quote) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }

    return quote;
  }

  private async recalculateQuoteTotals(quoteId: number): Promise<void> {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        quoteLines: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }

    const quoteLines =
      quote.quoteLines ??
      (await this.prisma.quoteLine.findMany({
        where: { quoteId },
        orderBy: { id: 'asc' },
      }));
    const pricing = calculateCommercialDocument({
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
        deliveryDateOverride: line.deliveryDateOverride,
      })),
      taxMode: quote.taxMode === 'inclusive' ? 'inclusive' : 'exclusive',
      documentDiscountPercent: quote.documentDiscountPercent,
    });

    const executeRecalculation = async (transactionalPrisma: any) => {
      if (typeof transactionalPrisma.quoteLine?.update === 'function') {
        await Promise.all(
          pricing.lines.map((line, index) =>
            transactionalPrisma.quoteLine.update({
              where: { id: quoteLines[index].id },
              data: {
                itemCode: line.itemCode,
                itemName: line.itemName,
                description: line.description,
                unit: line.unit,
                unitPrice: line.unitPrice,
                lineDiscountPercent: line.lineDiscountPercent,
                taxRate: line.taxRate,
                deliveryDateOverride: line.deliveryDateOverride ?? null,
                lineTotal: line.lineTotal,
                taxAmount: line.taxAmount,
                totalAmount: line.totalAmount,
              },
            }),
          ),
        );
      }

      if (typeof transactionalPrisma.quote?.update === 'function') {
        await transactionalPrisma.quote.update({
          where: { id: quoteId },
          data: {
            subtotalAmount: pricing.subtotalAmount,
            discountAmount: pricing.discountAmount,
            taxAmount: pricing.taxAmount,
            totalAmount: pricing.totalAmount,
          },
        });
      }
    };
    const prismaWithOptionalTransaction = this.prisma as typeof this.prisma & {
      $transaction?: unknown;
    };
    const transaction = prismaWithOptionalTransaction.$transaction as
      | ((callback: (prisma: any) => Promise<any>) => Promise<any>)
      | undefined;

    if (typeof transaction === 'function') {
      await transaction.call(this.prisma, executeRecalculation);
      return;
    }

    await executeRecalculation(this.prisma);
  }
}
