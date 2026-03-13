import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import {
  normalizeOptionalString,
} from '../commercial-utils';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import type { CustomerAddressDto } from './dto/customer-address.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

const CUSTOMER_INCLUDE = {
  contacts: {
    orderBy: { id: 'asc' },
  },
  quotes: {
    orderBy: { updatedAt: 'desc' },
  },
  salesOrders: {
    orderBy: { updatedAt: 'desc' },
  },
} satisfies Prisma.CustomerInclude;

type CustomerRecord = Prisma.CustomerGetPayload<{
  include: typeof CUSTOMER_INCLUDE;
}>;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberingService: NumberingService,
  ) {}

  async findAll(): Promise<CustomerResponseDto[]> {
    const customers = await this.prisma.customer.findMany({
      include: CUSTOMER_INCLUDE,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    const numberingSnapshot = await this.numberingService.getSnapshot();

    return customers.map((customer) => this.toCustomerResponse(customer, numberingSnapshot));
  }

  async findOne(id: number): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: CUSTOMER_INCLUDE,
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toCustomerResponse(customer, numberingSnapshot);
  }

  async create(payload: CreateCustomerDto): Promise<CustomerResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();
    const created = await this.prisma.customer.create({
      data: {
        code: normalizeOptionalString(payload.code),
        name: payload.name.trim(),
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        vatNumber: normalizeOptionalString(payload.vatNumber),
        website: normalizeOptionalString(payload.website),
        billingStreet: normalizeOptionalString(payload.billingAddress?.street),
        billingCity: normalizeOptionalString(payload.billingAddress?.city),
        billingPostcode: normalizeOptionalString(payload.billingAddress?.postcode),
        billingStateRegion: normalizeOptionalString(payload.billingAddress?.stateRegion),
        billingCountry: normalizeOptionalString(payload.billingAddress?.country),
        shippingStreet: normalizeOptionalString(payload.shippingAddress?.street),
        shippingCity: normalizeOptionalString(payload.shippingAddress?.city),
        shippingPostcode: normalizeOptionalString(payload.shippingAddress?.postcode),
        shippingStateRegion: normalizeOptionalString(payload.shippingAddress?.stateRegion),
        shippingCountry: normalizeOptionalString(payload.shippingAddress?.country),
        defaultPaymentTerm: normalizeOptionalString(payload.defaultPaymentTerm),
        defaultShippingTerm: normalizeOptionalString(payload.defaultShippingTerm),
        defaultShippingMethod: normalizeOptionalString(payload.defaultShippingMethod),
        defaultDocumentDiscountPercent: payload.defaultDocumentDiscountPercent ?? 0,
        defaultTaxRate: payload.defaultTaxRate ?? 0,
        internalNotes: normalizeOptionalString(payload.internalNotes),
        isActive: payload.isActive ?? true,
        contacts:
          payload.contacts && payload.contacts.length > 0
            ? {
                create: this.normalizeContacts(payload.contacts),
              }
            : undefined,
      },
      include: CUSTOMER_INCLUDE,
    });

    const customer =
      created.code != null
        ? created
        : await this.prisma.customer.update({
            where: { id: created.id },
            data: {
              code: this.numberingService.formatFromSnapshot(
                numberingSnapshot,
                'customers',
                created.id,
              ),
            },
            include: CUSTOMER_INCLUDE,
          });

    return this.toCustomerResponse(customer, numberingSnapshot);
  }

  async update(id: number, payload: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    const executeUpdate = async (transactionalPrisma: any) => {
      await transactionalPrisma.customer.update({
        where: { id },
        data: {
          code:
            payload.code !== undefined
              ? normalizeOptionalString(payload.code)
              : undefined,
          name: payload.name?.trim(),
          email:
            payload.email !== undefined ? normalizeOptionalString(payload.email) : undefined,
          phone:
            payload.phone !== undefined ? normalizeOptionalString(payload.phone) : undefined,
          vatNumber:
            payload.vatNumber !== undefined
              ? normalizeOptionalString(payload.vatNumber)
              : undefined,
          website:
            payload.website !== undefined ? normalizeOptionalString(payload.website) : undefined,
          billingStreet:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.street)
              : undefined,
          billingCity:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.city)
              : undefined,
          billingPostcode:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.postcode)
              : undefined,
          billingStateRegion:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.stateRegion)
              : undefined,
          billingCountry:
            payload.billingAddress !== undefined
              ? normalizeOptionalString(payload.billingAddress?.country)
              : undefined,
          shippingStreet:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.street)
              : undefined,
          shippingCity:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.city)
              : undefined,
          shippingPostcode:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.postcode)
              : undefined,
          shippingStateRegion:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.stateRegion)
              : undefined,
          shippingCountry:
            payload.shippingAddress !== undefined
              ? normalizeOptionalString(payload.shippingAddress?.country)
              : undefined,
          defaultPaymentTerm:
            payload.defaultPaymentTerm !== undefined
              ? normalizeOptionalString(payload.defaultPaymentTerm)
              : undefined,
          defaultShippingTerm:
            payload.defaultShippingTerm !== undefined
              ? normalizeOptionalString(payload.defaultShippingTerm)
              : undefined,
          defaultShippingMethod:
            payload.defaultShippingMethod !== undefined
              ? normalizeOptionalString(payload.defaultShippingMethod)
              : undefined,
          defaultDocumentDiscountPercent:
            payload.defaultDocumentDiscountPercent !== undefined
              ? payload.defaultDocumentDiscountPercent
              : undefined,
          defaultTaxRate:
            payload.defaultTaxRate !== undefined ? payload.defaultTaxRate : undefined,
          internalNotes:
            payload.internalNotes !== undefined
              ? normalizeOptionalString(payload.internalNotes)
              : undefined,
          isActive: payload.isActive,
        },
      });

      if (payload.contacts !== undefined) {
        await transactionalPrisma.contact.deleteMany({
          where: { customerId: id },
        });

        if (payload.contacts.length > 0) {
          await transactionalPrisma.contact.createMany({
            data: this.normalizeContacts(payload.contacts).map((contact) => ({
              customerId: id,
              ...contact,
            })),
          });
        }
      }

      return transactionalPrisma.customer.findUnique({
        where: { id },
        include: CUSTOMER_INCLUDE,
      });
    };
    const prismaWithOptionalTransaction = this.prisma as typeof this.prisma & {
      $transaction?: unknown;
    };
    const transaction = prismaWithOptionalTransaction.$transaction as
      | ((callback: (prisma: any) => Promise<any>) => Promise<any>)
      | undefined;
    const updatedCustomer =
      typeof transaction === 'function'
        ? await transaction.call(this.prisma, executeUpdate)
        : await executeUpdate(this.prisma);

    if (!updatedCustomer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    const numberingSnapshot = await this.numberingService.getSnapshot();
    return this.toCustomerResponse(updatedCustomer, numberingSnapshot);
  }

  private normalizeContacts(
    contacts: Array<{
      name: string;
      jobTitle?: string;
      email?: string;
      phone?: string;
      isPrimary?: boolean;
      isActive?: boolean;
    }>,
  ): Array<{
    name: string;
    jobTitle: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
    isActive: boolean;
  }> {
    const normalizedContacts = contacts.map((contact) => ({
      name: contact.name.trim(),
      jobTitle: normalizeOptionalString(contact.jobTitle),
      email: normalizeOptionalString(contact.email),
      phone: normalizeOptionalString(contact.phone),
      isPrimary: Boolean(contact.isPrimary),
      isActive: contact.isActive ?? true,
    }));

    const firstPrimaryIndex = normalizedContacts.findIndex((contact) => contact.isPrimary);
    const ensuredPrimaryIndex = firstPrimaryIndex >= 0 ? firstPrimaryIndex : 0;

    return normalizedContacts.map((contact, index) => ({
      ...contact,
      isPrimary: index === ensuredPrimaryIndex,
    }));
  }

  private toCustomerResponse(
    customer: CustomerRecord,
    numberingSnapshot: NumberingSnapshot,
  ): CustomerResponseDto {
    const contacts = customer.contacts ?? [];
    const quotes = customer.quotes ?? [];
    const salesOrders = customer.salesOrders ?? [];

    return {
      id: customer.id,
      code:
        customer.code ??
        this.numberingService.formatFromSnapshot(numberingSnapshot, 'customers', customer.id),
      name: customer.name,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      vatNumber: customer.vatNumber ?? null,
      website: customer.website ?? null,
      billingAddress: this.toAddress(customer, 'billing'),
      shippingAddress: this.toAddress(customer, 'shipping'),
      defaultPaymentTerm: customer.defaultPaymentTerm ?? null,
      defaultShippingTerm: customer.defaultShippingTerm ?? null,
      defaultShippingMethod: customer.defaultShippingMethod ?? null,
      defaultDocumentDiscountPercent: customer.defaultDocumentDiscountPercent ?? 0,
      defaultTaxRate: customer.defaultTaxRate ?? 0,
      internalNotes: customer.internalNotes ?? null,
      isActive: customer.isActive ?? true,
      contacts: contacts.map((contact) => ({
        id: contact.id,
        customerId: contact.customerId,
        name: contact.name,
        jobTitle: contact.jobTitle ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        isPrimary: contact.isPrimary ?? false,
        isActive: contact.isActive ?? true,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })),
      documents: [
        ...quotes.map((quote) => ({
          kind: 'quote' as const,
          id: quote.id,
          documentNumber: this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'quotes',
            quote.id,
          ),
          status: quote.status,
          promisedDate: quote.promisedDate ?? null,
          totalAmount: quote.totalAmount ?? 0,
          updatedAt: quote.updatedAt,
        })),
        ...salesOrders.map((salesOrder) => ({
          kind: 'sales_order' as const,
          id: salesOrder.id,
          documentNumber: this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'sales_orders',
            salesOrder.id,
          ),
          status: salesOrder.status,
          promisedDate: salesOrder.promisedDate ?? null,
          totalAmount: salesOrder.totalAmount ?? 0,
          updatedAt: salesOrder.updatedAt,
        })),
      ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  private toAddress(
    customer: CustomerRecord,
    kind: 'billing' | 'shipping',
  ): CustomerAddressDto {
    if (kind === 'billing') {
      return {
        street: customer.billingStreet ?? undefined,
        city: customer.billingCity ?? undefined,
        postcode: customer.billingPostcode ?? undefined,
        stateRegion: customer.billingStateRegion ?? undefined,
        country: customer.billingCountry ?? undefined,
      };
    }

    return {
      street: customer.shippingStreet ?? undefined,
      city: customer.shippingCity ?? undefined,
      postcode: customer.shippingPostcode ?? undefined,
      stateRegion: customer.shippingStateRegion ?? undefined,
      country: customer.shippingCountry ?? undefined,
    };
  }
}
