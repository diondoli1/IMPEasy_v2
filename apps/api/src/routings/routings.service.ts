import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { buildItemCode } from '../commercial-utils';
import { ItemsService } from '../items/items.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutingOperationDto } from './dto/create-routing-operation.dto';
import { CreateRoutingDto } from './dto/create-routing.dto';
import { RoutingLinkResponseDto } from './dto/routing-link-response.dto';
import { RoutingOperationResponseDto } from './dto/routing-operation-response.dto';
import { RoutingResponseDto } from './dto/routing-response.dto';
import { UpdateRoutingOperationDto } from './dto/update-routing-operation.dto';
import { UpdateRoutingDto } from './dto/update-routing.dto';

const ROUTING_INCLUDE = {
  item: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} satisfies Prisma.RoutingInclude;

type RoutingRecord = Prisma.RoutingGetPayload<{
  include: typeof ROUTING_INCLUDE;
}>;

@Injectable()
export class RoutingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemsService: ItemsService,
  ) {}

  async findOne(id: number): Promise<RoutingResponseDto> {
    const routing = await this.prisma.routing.findUnique({
      where: { id },
      include: ROUTING_INCLUDE,
    });

    if (!routing) {
      throw new NotFoundException(`Routing ${id} not found`);
    }

    return this.toRoutingResponse(routing);
  }

  async create(payload: CreateRoutingDto): Promise<RoutingResponseDto> {
    await this.itemsService.findOne(payload.itemId);

    const created = await this.prisma.routing.create({
      data: {
        itemId: payload.itemId,
        code: payload.code?.trim() || null,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        status: payload.status?.trim() || 'draft',
      },
      include: ROUTING_INCLUDE,
    });

    return this.findOne(created.id);
  }

  async update(id: number, payload: UpdateRoutingDto): Promise<RoutingResponseDto> {
    await this.findOne(id);

    const updated = await this.prisma.routing.update({
      where: { id },
      data: {
        code: payload.code !== undefined ? payload.code.trim() || null : undefined,
        name: payload.name?.trim(),
        description: payload.description !== undefined ? payload.description.trim() || null : undefined,
        status: payload.status !== undefined ? payload.status.trim() || 'draft' : undefined,
      },
      include: ROUTING_INCLUDE,
    });

    return this.findOne(updated.id);
  }

  async listByItem(itemId: number): Promise<RoutingResponseDto[]> {
    await this.itemsService.findOne(itemId);

    const routings = await this.prisma.routing.findMany({
      where: { itemId },
      include: ROUTING_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return routings.map((routing) => this.toRoutingResponse(routing));
  }

  async listRoutingOperations(routingId: number): Promise<RoutingOperationResponseDto[]> {
    await this.ensureRoutingExists(routingId);

    const operations = await this.prisma.routingOperation.findMany({
      where: { routingId },
      include: { workstationGroup: { select: { name: true } } },
      orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
    });

    return operations.map((operation) => this.toRoutingOperationResponse(operation));
  }

  async createRoutingOperation(
    routingId: number,
    payload: CreateRoutingOperationDto,
  ): Promise<RoutingOperationResponseDto> {
    await this.ensureRoutingExists(routingId);

    const created = await this.prisma.routingOperation.create({
      data: {
        routingId,
        sequence: payload.sequence,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        workstation: payload.workstation?.trim() || null,
        workstationGroupId: payload.workstationGroupId ?? null,
        setupTimeMinutes: payload.setupTimeMinutes ?? 0,
        runTimeMinutes: payload.runTimeMinutes ?? 0,
        cost: payload.cost ?? null,
        queueNotes: payload.queueNotes?.trim() || null,
        moveNotes: payload.moveNotes?.trim() || null,
      },
      include: { workstationGroup: { select: { name: true } } },
    });

    return this.toRoutingOperationResponse(created);
  }

  async updateRoutingOperation(
    routingId: number,
    operationId: number,
    payload: UpdateRoutingOperationDto,
  ): Promise<RoutingOperationResponseDto> {
    await this.ensureRoutingExists(routingId);

    const existing = await this.prisma.routingOperation.findUnique({
      where: { id: operationId },
    });

    if (!existing || existing.routingId !== routingId) {
      throw new NotFoundException(
        `Routing operation ${operationId} not found for routing ${routingId}`,
      );
    }

    const updated = await this.prisma.routingOperation.update({
      where: { id: operationId },
      data: {
        sequence: payload.sequence,
        name: payload.name?.trim(),
        description: payload.description !== undefined ? payload.description.trim() || null : undefined,
        workstation: payload.workstation !== undefined ? payload.workstation.trim() || null : undefined,
        workstationGroupId: payload.workstationGroupId !== undefined ? payload.workstationGroupId : undefined,
        setupTimeMinutes: payload.setupTimeMinutes,
        runTimeMinutes: payload.runTimeMinutes,
        cost: payload.cost !== undefined ? payload.cost : undefined,
        queueNotes: payload.queueNotes !== undefined ? payload.queueNotes.trim() || null : undefined,
        moveNotes: payload.moveNotes !== undefined ? payload.moveNotes.trim() || null : undefined,
      },
      include: { workstationGroup: { select: { name: true } } },
    });

    return this.toRoutingOperationResponse(updated);
  }

  async setAsDefault(routingId: number): Promise<RoutingLinkResponseDto> {
    const routing = await this.ensureRoutingExists(routingId);

    const updatedItem = await this.itemsService.setDefaultRouting(routing.itemId, routing.id);

    return {
      itemId: updatedItem.id,
      routingId: routing.id,
    };
  }

  private async ensureRoutingExists(routingId: number): Promise<RoutingRecord> {
    const routing = await this.prisma.routing.findUnique({
      where: { id: routingId },
      include: ROUTING_INCLUDE,
    });

    if (!routing) {
      throw new NotFoundException(`Routing ${routingId} not found`);
    }

    return routing;
  }

  private toRoutingResponse(routing: RoutingRecord): RoutingResponseDto {
    const itemCode = routing.item?.code ?? buildItemCode(routing.itemId);
    const itemName = routing.item?.name ?? `Item ${routing.itemId}`;

    return {
      id: routing.id,
      itemId: routing.itemId,
      itemCode,
      itemName,
      code: routing.code ?? `ROUT-${String(routing.id).padStart(4, '0')}`,
      name: routing.name,
      description: routing.description ?? null,
      status: routing.status,
      createdAt: routing.createdAt,
      updatedAt: routing.updatedAt,
    };
  }

  private toRoutingOperationResponse(
    operation: {
      id: number;
      routingId: number;
      sequence: number;
      name: string;
      description: string | null;
      workstation: string | null;
      workstationGroupId: number | null;
      setupTimeMinutes: number;
      runTimeMinutes: number;
      cost: number | null;
      queueNotes: string | null;
      moveNotes: string | null;
      createdAt: Date;
      updatedAt: Date;
      workstationGroup?: { name: string } | null;
    },
  ): RoutingOperationResponseDto {
    return {
      id: operation.id,
      routingId: operation.routingId,
      sequence: operation.sequence,
      name: operation.name,
      description: operation.description ?? null,
      workstation: operation.workstation ?? null,
      workstationGroupId: operation.workstationGroupId ?? null,
      workstationGroupName: operation.workstationGroup?.name ?? null,
      setupTimeMinutes: operation.setupTimeMinutes,
      runTimeMinutes: operation.runTimeMinutes,
      cost: operation.cost ?? null,
      queueNotes: operation.queueNotes ?? null,
      moveNotes: operation.moveNotes ?? null,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt,
    };
  }
}
