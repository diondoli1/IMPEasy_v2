import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorInvoiceDto } from './dto/create-vendor-invoice.dto';
import { VendorInvoiceResponseDto } from './dto/vendor-invoice-response.dto';
import { SuppliersService } from './suppliers.service';

@Injectable()
export class VendorInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suppliersService: SuppliersService,
  ) {}

  async findAll(): Promise<VendorInvoiceResponseDto[]> {
    const invoices = await this.prisma.vendorInvoice.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            number: true,
          },
        },
      },
      orderBy: [{ invoiceDate: 'desc' }, { id: 'desc' }],
    });

    return invoices.map((inv) => this.toResponse(inv));
  }

  async create(payload: CreateVendorInvoiceDto): Promise<VendorInvoiceResponseDto> {
    await this.suppliersService.ensureSupplierExists(payload.supplierId);

    if (payload.purchaseOrderId) {
      const po = await this.prisma.purchaseOrder.findUnique({
        where: { id: payload.purchaseOrderId },
      });
      if (!po) {
        throw new NotFoundException(`Purchase order ${payload.purchaseOrderId} not found`);
      }
      if (po.supplierId !== payload.supplierId) {
        throw new NotFoundException(
          `Purchase order ${payload.purchaseOrderId} does not belong to supplier ${payload.supplierId}`,
        );
      }
    }

    const invoiceDate = payload.invoiceDate ? new Date(payload.invoiceDate) : new Date();

    const created = await this.prisma.vendorInvoice.create({
      data: {
        supplierId: payload.supplierId,
        purchaseOrderId: payload.purchaseOrderId ?? null,
        vendorInvoiceId: payload.vendorInvoiceId?.trim() || null,
        invoiceDate,
        totalAmount: payload.totalAmount,
        taxAmount: payload.taxAmount ?? 0,
        paidAmount: payload.paidAmount ?? 0,
        status: payload.status ?? 'unpaid',
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    const number = `VI${String(created.id).padStart(5, '0')}`;
    const updated = await this.prisma.vendorInvoice.update({
      where: { id: created.id },
      data: { number },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    return this.toResponse(updated);
  }

  private toResponse(
    inv: {
      id: number;
      number: string | null;
      vendorInvoiceId: string | null;
      invoiceDate: Date;
      supplierId: number;
      purchaseOrderId: number | null;
      totalAmount: number;
      taxAmount: number;
      paidAmount: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      supplier: { code: string | null; name: string };
      purchaseOrder: { number: string | null } | null;
    },
  ): VendorInvoiceResponseDto {
    const num = inv.number ?? `VI${String(inv.id).padStart(5, '0')}`;
    return {
      id: inv.id,
      number: num,
      vendorInvoiceId: inv.vendorInvoiceId,
      invoiceDate: inv.invoiceDate,
      supplierId: inv.supplierId,
      supplierCode: inv.supplier.code,
      supplierName: inv.supplier.name,
      purchaseOrderId: inv.purchaseOrderId,
      purchaseOrderNumber: inv.purchaseOrder?.number ?? null,
      totalAmount: inv.totalAmount,
      taxAmount: inv.taxAmount,
      paidAmount: inv.paidAmount,
      status: inv.status,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    };
  }
}
