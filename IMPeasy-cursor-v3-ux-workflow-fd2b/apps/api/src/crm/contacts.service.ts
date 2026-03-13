import { Injectable, NotFoundException } from '@nestjs/common';

import { normalizeOptionalString } from '../commercial-utils';
import { PrismaService } from '../prisma/prisma.service';
import { ContactResponseDto } from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByCustomer(customerId: number): Promise<ContactResponseDto[]> {
    await this.ensureCustomerExists(customerId);

    return this.prisma.contact.findMany({
      where: { customerId },
      orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number): Promise<ContactResponseDto> {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundException(`Contact ${id} not found`);
    }

    return contact;
  }

  async create(customerId: number, payload: CreateContactDto): Promise<ContactResponseDto> {
    await this.ensureCustomerExists(customerId);

    const executeCreate = async (transactionalPrisma: any) => {
      if (payload.isPrimary) {
        await transactionalPrisma.contact.updateMany({
          where: { customerId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return transactionalPrisma.contact.create({
        data: {
          customerId,
          name: payload.name.trim(),
          jobTitle: normalizeOptionalString(payload.jobTitle),
          email: normalizeOptionalString(payload.email),
          phone: normalizeOptionalString(payload.phone),
          isPrimary: payload.isPrimary ?? false,
          isActive: payload.isActive ?? true,
        },
      });
    };
    const prismaWithOptionalTransaction = this.prisma as typeof this.prisma & {
      $transaction?: unknown;
    };
    const transaction = prismaWithOptionalTransaction.$transaction as
      | ((callback: (prisma: any) => Promise<any>) => Promise<any>)
      | undefined;

    return typeof transaction === 'function'
      ? transaction.call(this.prisma, executeCreate)
      : executeCreate(this.prisma);
  }

  async update(id: number, payload: UpdateContactDto): Promise<ContactResponseDto> {
    const existingContact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      throw new NotFoundException(`Contact ${id} not found`);
    }

    const executeUpdate = async (transactionalPrisma: any) => {
      if (payload.isPrimary) {
        await transactionalPrisma.contact.updateMany({
          where: {
            customerId: existingContact.customerId,
            isPrimary: true,
            id: {
              not: id,
            },
          },
          data: { isPrimary: false },
        });
      }

      return transactionalPrisma.contact.update({
        where: { id },
        data: {
          name: payload.name?.trim(),
          jobTitle:
            payload.jobTitle !== undefined
              ? normalizeOptionalString(payload.jobTitle)
              : undefined,
          email:
            payload.email !== undefined ? normalizeOptionalString(payload.email) : undefined,
          phone:
            payload.phone !== undefined ? normalizeOptionalString(payload.phone) : undefined,
          isPrimary: payload.isPrimary,
          isActive: payload.isActive,
        },
      });
    };
    const prismaWithOptionalTransaction = this.prisma as typeof this.prisma & {
      $transaction?: unknown;
    };
    const transaction = prismaWithOptionalTransaction.$transaction as
      | ((callback: (prisma: any) => Promise<any>) => Promise<any>)
      | undefined;

    return typeof transaction === 'function'
      ? transaction.call(this.prisma, executeUpdate)
      : executeUpdate(this.prisma);
  }

  private async ensureCustomerExists(customerId: number): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
  }
}
