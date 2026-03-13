import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { ShippingService } from '../shipping/shipping.service';
import { InvoiceRegisterResponseDto } from './dto/invoice-register-response.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

const INVOICE_INCLUDE = {
  shipment: true,
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  invoiceLines: {
    include: {
      shipmentLine: {
        include: {
          salesOrderLine: true,
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.InvoiceInclude;

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: typeof INVOICE_INCLUDE;
}>;

@Injectable()
export class InvoicingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingService: ShippingService,
    private readonly salesOrdersService: SalesOrdersService,
    private readonly numberingService: NumberingService,
  ) {}

  async findAll(): Promise<InvoiceRegisterResponseDto[]> {
    const invoices = await this.prisma.invoice.findMany({
      include: INVOICE_INCLUDE,
      orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
    });
    const numberingSnapshot = await this.numberingService.getSnapshot();

    return invoices.map((invoice) => this.mapInvoiceRegister(invoice, numberingSnapshot));
  }

  async findOne(id: number): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return this.mapInvoice(invoice, await this.numberingService.getSnapshot());
  }

  async findByShipmentId(shipmentId: number): Promise<InvoiceResponseDto> {
    await this.shippingService.findOne(shipmentId);

    const invoice = await this.findInvoiceRecordByShipmentId(shipmentId);
    if (!invoice) {
      throw new NotFoundException(`Invoice for shipment ${shipmentId} not found`);
    }

    return this.mapInvoice(invoice, await this.numberingService.getSnapshot());
  }

  async createForShipment(shipmentId: number): Promise<InvoiceResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const shipment = await this.shippingService.findOne(shipmentId);

    if (shipment.status !== 'delivered') {
      throw new BadRequestException(
        `Only delivered shipments can be invoiced. Current status: ${shipment.status}`,
      );
    }

    if (shipment.shipmentLines.length === 0) {
      throw new BadRequestException(
        `Shipment ${shipmentId} has no lines and cannot be invoiced`,
      );
    }

    const existingInvoice = await this.findInvoiceRecordByShipmentId(shipmentId);
    if (existingInvoice) {
      throw new BadRequestException(
        `Shipment ${shipmentId} already has invoice ${existingInvoice.id}`,
      );
    }

    const salesOrder = await this.salesOrdersService.findOne(shipment.salesOrderId);
    const salesOrderLinesById = new Map(
      salesOrder.salesOrderLines.map((line) => [line.id, line]),
    );
    const issueDate = new Date();
    const dueDate = salesOrder.promisedDate ?? null;

    const created = await this.prisma.invoice.create({
      data: {
        shipmentId,
        customerId: salesOrder.customerId,
        status: 'issued',
        issueDate,
        dueDate,
        invoiceLines: {
          create: shipment.shipmentLines.map((shipmentLine) => {
            const salesOrderLine = salesOrderLinesById.get(shipmentLine.salesOrderLineId);
            if (!salesOrderLine) {
              throw new BadRequestException(
                `Shipment line ${shipmentLine.id} cannot be invoiced because sales order line ${shipmentLine.salesOrderLineId} is missing`,
              );
            }

            return {
              shipmentLineId: shipmentLine.id,
              quantity: shipmentLine.quantity,
              unitPrice: salesOrderLine.unitPrice,
              lineTotal: this.calculateLineTotal(
                salesOrderLine.unitPrice,
                shipmentLine.quantity,
              ),
            };
          }),
        },
      },
      include: INVOICE_INCLUDE,
    });

    const numbered = await this.prisma.invoice.update({
      where: { id: created.id },
      data: {
        number:
          created.number ??
          this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'invoices',
            created.id,
          ),
      },
      include: INVOICE_INCLUDE,
    });

    if (salesOrder.status === 'shipped') {
      await this.prisma.salesOrder.update({
        where: { id: salesOrder.id },
        data: { status: 'invoiced' },
      });
      await this.prisma.salesOrderAudit.create({
        data: {
          salesOrderId: salesOrder.id,
          action: 'status_transition',
          fromStatus: salesOrder.status,
          toStatus: 'invoiced',
          actor: 'system',
        },
      });
    }

    return this.mapInvoice(numbered, numberingSnapshot);
  }

  async markPaidForShipment(shipmentId: number): Promise<InvoiceResponseDto> {
    await this.shippingService.findOne(shipmentId);

    const invoice = await this.findInvoiceRecordByShipmentId(shipmentId);
    if (!invoice) {
      throw new NotFoundException(`Invoice for shipment ${shipmentId} not found`);
    }

    if (invoice.status !== 'issued') {
      throw new BadRequestException(
        `Only issued invoices can be marked paid. Current status: ${invoice.status}`,
      );
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
      include: INVOICE_INCLUDE,
    });

    return this.mapInvoice(updated, await this.numberingService.getSnapshot());
  }

  private async findInvoiceRecordByShipmentId(
    shipmentId: number,
  ): Promise<InvoiceWithRelations | null> {
    return this.prisma.invoice.findUnique({
      where: { shipmentId },
      include: INVOICE_INCLUDE,
    });
  }

  private calculateLineTotal(unitPrice: number, quantity: number): number {
    return Number((unitPrice * quantity).toFixed(2));
  }

  private mapInvoiceRegister(
    invoice: InvoiceWithRelations,
    numberingSnapshot: NumberingSnapshot,
  ): InvoiceRegisterResponseDto {
    return {
      id: invoice.id,
      number:
        invoice.number ??
        this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'invoices',
          invoice.id,
        ),
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      salesOrderId: invoice.shipment.salesOrderId,
      salesOrderNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'sales_orders',
        invoice.shipment.salesOrderId,
      ),
      shipmentId: invoice.shipmentId,
      shipmentNumber:
        invoice.shipment.number ??
        this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'shipments',
          invoice.shipmentId,
        ),
      status: invoice.status,
      totalAmount: Number(
        invoice.invoiceLines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2),
      ),
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate ?? null,
      paidAt: invoice.paidAt ?? null,
    };
  }

  private mapInvoice(
    invoice: InvoiceWithRelations,
    numberingSnapshot: NumberingSnapshot,
  ): InvoiceResponseDto {
    return {
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
        invoice.shipment.number ??
        this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'shipments',
          invoice.shipmentId,
        ),
      salesOrderId: invoice.shipment.salesOrderId,
      salesOrderNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'sales_orders',
        invoice.shipment.salesOrderId,
      ),
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate ?? null,
      paidAt: invoice.paidAt,
      totalAmount: Number(
        invoice.invoiceLines
          .reduce((total, line) => total + line.lineTotal, 0)
          .toFixed(2),
      ),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      invoiceLines: invoice.invoiceLines.map((line) => ({
        id: line.id,
        invoiceId: line.invoiceId,
        shipmentLineId: line.shipmentLineId,
        salesOrderLineId: line.shipmentLine.salesOrderLineId,
        itemId: line.shipmentLine.salesOrderLine.itemId,
        itemCode: line.shipmentLine.salesOrderLine.itemCode ?? null,
        itemName: line.shipmentLine.salesOrderLine.itemName ?? `Item ${line.shipmentLine.salesOrderLine.itemId}`,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
      })),
    };
  }
}
