import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { buildItemCode } from '../commercial-utils';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { NumberingService, type NumberingSnapshot } from '../settings/numbering.service';
import { CompleteOperationDto } from './dto/complete-operation.dto';
import { CreateProductionLogDto } from './dto/create-production-log.dto';
import { MaterialBookingResponseDto } from './dto/material-booking-response.dto';
import {
  MaterialRequirementAvailableLotResponseDto,
  MaterialRequirementResponseDto,
} from './dto/material-requirement-response.dto';
import { OperationDetailResponseDto } from './dto/operation-detail-response.dto';
import { OperationQueueResponseDto } from './dto/operation-queue-response.dto';
import { OperationSummaryResponseDto } from './dto/operation-summary-response.dto';
import { ProductionLogResponseDto } from './dto/production-log-response.dto';
import { UpdateMaterialBookingDto } from './dto/update-material-booking.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpsertMaterialBookingDto } from './dto/upsert-material-booking.dto';
import { WorkOrderDetailResponseDto } from './dto/work-order-detail-response.dto';
import { WorkOrderResponseDto } from './dto/work-order-response.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

const ITEM_SELECT = {
  id: true,
  code: true,
  name: true,
  unitOfMeasure: true,
  defaultPrice: true,
} as const;

const WORK_ORDER_DETAIL_INCLUDE = {
  salesOrderLine: {
    include: {
      salesOrder: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      item: {
        select: ITEM_SELECT,
      },
    },
  },
  item: {
    select: ITEM_SELECT,
  },
  bom: {
    include: {
      bomItems: {
        include: {
          item: {
            select: ITEM_SELECT,
          },
        },
        orderBy: [{ rowOrder: 'asc' }, { id: 'asc' }],
      },
    },
  },
  routing: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  assignedOperator: {
    select: USER_SELECT,
  },
  finishedGoodsLot: {
    select: {
      id: true,
      lotNumber: true,
      quantityOnHand: true,
    },
  },
  workOrderOperations: {
    include: {
      routingOperation: true,
      assignedOperator: {
        select: USER_SELECT,
      },
    },
    orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
  },
  materialBookings: {
    include: {
      bomItem: {
        include: {
          item: {
            select: ITEM_SELECT,
          },
        },
      },
      stockLot: {
        select: {
          id: true,
          lotNumber: true,
          quantityOnHand: true,
          itemId: true,
        },
      },
    },
    orderBy: [{ id: 'asc' }],
  },
  historyEntries: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  },
} satisfies Prisma.WorkOrderInclude;

const OPERATION_INCLUDE = {
  routingOperation: true,
  assignedOperator: {
    select: USER_SELECT,
  },
  workOrder: {
    include: {
      salesOrderLine: {
        include: {
          salesOrder: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          item: {
            select: ITEM_SELECT,
          },
        },
      },
      item: {
        select: ITEM_SELECT,
      },
      routing: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      assignedOperator: {
        select: USER_SELECT,
      },
    },
  },
} satisfies Prisma.WorkOrderOperationInclude;

type WorkOrderRecord = Prisma.WorkOrderGetPayload<{
  include: typeof WORK_ORDER_DETAIL_INCLUDE;
}>;

type WorkOrderOperationRecord = Prisma.WorkOrderOperationGetPayload<{
  include: typeof OPERATION_INCLUDE;
}>;

type PrismaExecutor = PrismaService & {
  $transaction?: unknown;
};

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesOrdersService: SalesOrdersService,
    private readonly inventoryService: InventoryService,
    private readonly numberingService: NumberingService,
  ) {}

  async listAll(): Promise<WorkOrderResponseDto[]> {
    const workOrders = await this.prisma.workOrder.findMany({
      include: WORK_ORDER_DETAIL_INCLUDE,
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    });
    const numberingSnapshot = await this.numberingService.getSnapshot();

    return Promise.all(
      workOrders.map((workOrder) => this.toWorkOrderResponse(workOrder, numberingSnapshot)),
    );
  }

  async listBySalesOrder(salesOrderId: number): Promise<WorkOrderResponseDto[]> {
    await this.salesOrdersService.findOne(salesOrderId);

    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        salesOrderLine: {
          salesOrderId,
        },
      },
      include: WORK_ORDER_DETAIL_INCLUDE,
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    });
    const numberingSnapshot = await this.numberingService.getSnapshot();

    return Promise.all(
      workOrders.map((workOrder) => this.toWorkOrderResponse(workOrder, numberingSnapshot)),
    );
  }

  async generateForSalesOrder(salesOrderId: number): Promise<WorkOrderResponseDto[]> {
    const salesOrder = await this.salesOrdersService.findOne(salesOrderId);
    const numberingSnapshot = await this.numberingService.getSnapshot();

    if (!['released', 'in_production'].includes(salesOrder.status)) {
      throw new BadRequestException(
        `Manufacturing orders can only be created from released sales orders. Current status: ${salesOrder.status}`,
      );
    }

    await this.runWithOptionalTransaction(async (tx) => {
      for (const line of salesOrder.salesOrderLines) {
        const existing = await tx.workOrder.findUnique({
          where: { salesOrderLineId: line.id },
        });

        if (existing) {
          continue;
        }

        const item = await tx.item.findUnique({
          where: { id: line.itemId },
          select: {
            id: true,
            defaultBomId: true,
            defaultRoutingId: true,
          },
        });

        if (!item) {
          throw new NotFoundException(`Item ${line.itemId} not found`);
        }

        if (!item.defaultRoutingId) {
          throw new BadRequestException(
            `Item ${item.id} must have a default routing before creating manufacturing orders`,
          );
        }

        const [bom, routing, routingOperations] = await Promise.all([
          item.defaultBomId
            ? tx.bom.findUnique({
                where: { id: item.defaultBomId },
                select: {
                  id: true,
                  itemId: true,
                },
              })
            : Promise.resolve(null),
          tx.routing.findUnique({
            where: { id: item.defaultRoutingId },
            select: {
              id: true,
              itemId: true,
            },
          }),
          tx.routingOperation.findMany({
            where: { routingId: item.defaultRoutingId },
            orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
          }),
        ]);

        if (bom && bom.itemId !== item.id) {
          throw new BadRequestException(
            `Default BOM ${bom.id} does not belong to item ${item.id}`,
          );
        }

        if (!routing) {
          throw new NotFoundException(`Routing ${item.defaultRoutingId} not found`);
        }

        if (routing.itemId !== item.id) {
          throw new BadRequestException(
            `Default routing ${routing.id} does not belong to item ${item.id}`,
          );
        }

        if (routingOperations.length === 0) {
          throw new BadRequestException(
            `Routing ${routing.id} must have at least one operation before creating manufacturing orders`,
          );
        }

        const dueDate =
          line.deliveryDateOverride ?? salesOrder.promisedDate ?? salesOrder.orderDate ?? new Date();

        const created = await tx.workOrder.create({
          data: {
            salesOrderLineId: line.id,
            bomId: bom?.id ?? null,
            routingId: routing.id,
            quantity: line.quantity,
            dueDate,
            status: 'planned',
            assignedWorkstation: routingOperations[0]?.workstation ?? null,
          },
        });

        for (const operation of routingOperations) {
          await tx.workOrderOperation.create({
            data: {
              workOrderId: created.id,
              routingOperationId: operation.id,
              sequence: operation.sequence,
              plannedQuantity: line.quantity,
              status: 'queued',
              workstation: operation.workstation ?? null,
            },
          });
        }

        await this.appendHistory(
          tx,
          created.id,
          'created',
          'system',
          `Manufacturing order ${this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'manufacturing_orders',
            created.id,
          )} created from sales order line ${line.id}.`,
        );
      }
    });

    return this.listBySalesOrder(salesOrderId);
  }

  async createDirect(payload: {
    itemId: number;
    quantity: number;
    dueDate?: string;
    bomId?: number;
    routingId?: number;
  }): Promise<WorkOrderResponseDto> {
    const numberingSnapshot = await this.numberingService.getSnapshot();

    const item = await this.prisma.item.findUnique({
      where: { id: payload.itemId },
      select: {
        id: true,
        defaultBomId: true,
        defaultRoutingId: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Item ${payload.itemId} not found`);
    }

    const routingId = payload.routingId ?? item.defaultRoutingId;
    if (!routingId) {
      throw new BadRequestException(
        `Item ${item.id} must have a default routing or provide routingId for direct MO creation`,
      );
    }

    const bomId = payload.bomId ?? item.defaultBomId ?? null;

    const [bom, routing, routingOperations] = await Promise.all([
      bomId
        ? this.prisma.bom.findUnique({
            where: { id: bomId },
            select: { id: true, itemId: true },
          })
        : Promise.resolve(null),
      this.prisma.routing.findUnique({
        where: { id: routingId },
        select: { id: true, itemId: true },
      }),
      this.prisma.routingOperation.findMany({
        where: { routingId },
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
      }),
    ]);

    if (bom && bom.itemId !== item.id) {
      throw new BadRequestException(`BOM ${bom.id} does not belong to item ${item.id}`);
    }

    if (!routing) {
      throw new NotFoundException(`Routing ${routingId} not found`);
    }

    if (routing.itemId !== item.id) {
      throw new BadRequestException(`Routing ${routing.id} does not belong to item ${item.id}`);
    }

    if (routingOperations.length === 0) {
      throw new BadRequestException(
        `Routing ${routing.id} must have at least one operation before creating manufacturing orders`,
      );
    }

    const dueDate = payload.dueDate ? new Date(payload.dueDate) : new Date();

    const created = await this.prisma.workOrder.create({
      data: {
        salesOrderLineId: null,
        itemId: payload.itemId,
        bomId,
        routingId,
        quantity: payload.quantity,
        dueDate,
        status: 'planned',
        assignedWorkstation: routingOperations[0]?.workstation ?? null,
      },
      include: WORK_ORDER_DETAIL_INCLUDE,
    });

    for (const operation of routingOperations) {
      await this.prisma.workOrderOperation.create({
        data: {
          workOrderId: created.id,
          routingOperationId: operation.id,
          sequence: operation.sequence,
          plannedQuantity: payload.quantity,
          status: 'queued',
          workstation: operation.workstation ?? null,
        },
      });
    }

    await this.appendHistory(
      this.prisma,
      created.id,
      'created',
      'system',
      `Manufacturing order ${this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'manufacturing_orders',
        created.id,
      )} created directly for item ${payload.itemId}.`,
    );

    return this.toWorkOrderResponse(created, numberingSnapshot);
  }

  async findOne(id: number): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.getWorkOrderOrThrow(id);
    return this.toWorkOrderDetailResponse(
      workOrder,
      await this.numberingService.getSnapshot(),
    );
  }

  async update(id: number, payload: UpdateWorkOrderDto): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.getWorkOrderOrThrow(id);
    await this.ensureAssignedOperatorExists(payload.assignedOperatorId);

    const changeMessages: string[] = [];
    if (payload.dueDate) {
      changeMessages.push(`Due date updated to ${payload.dueDate}.`);
    }
    if (payload.assignedOperatorId) {
      changeMessages.push(`Assigned operator updated to user ${payload.assignedOperatorId}.`);
    }
    if (payload.assignedWorkstation) {
      changeMessages.push(`Assigned workstation updated to ${payload.assignedWorkstation}.`);
    }
    if (payload.notes !== undefined) {
      changeMessages.push('Planner notes updated.');
    }

    await this.runWithOptionalTransaction(async (tx) => {
      await tx.workOrder.update({
        where: { id },
        data: {
          dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
          assignedOperatorId: payload.assignedOperatorId,
          assignedWorkstation:
            payload.assignedWorkstation !== undefined
              ? payload.assignedWorkstation.trim() || null
              : undefined,
          notes: payload.notes !== undefined ? payload.notes.trim() || null : undefined,
        },
      });

      if (payload.assignedOperatorId) {
        const openOperations = await tx.workOrderOperation.findMany({
          where: {
            workOrderId: id,
            assignedOperatorId: null,
            status: {
              in: ['queued', 'ready', 'running', 'paused'],
            },
          },
        });

        for (const operation of openOperations) {
          await tx.workOrderOperation.update({
            where: { id: operation.id },
            data: {
              assignedOperatorId: payload.assignedOperatorId,
            },
          });
        }
      }

      if (changeMessages.length > 0) {
        await this.appendHistory(
          tx,
          id,
          'updated',
          'system',
          changeMessages.join(' '),
        );
      }
    });

    return this.findOne(workOrder.id);
  }

  async releaseWorkOrder(id: number): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.getWorkOrderOrThrow(id);
    const numberingSnapshot = await this.numberingService.getSnapshot();

    if (workOrder.status !== 'planned') {
      throw new BadRequestException(
        `Manufacturing order release is allowed only from planned status. Current status: ${workOrder.status}`,
      );
    }

    const materials = await this.buildMaterialRequirements(workOrder);
    const incomplete = materials.find(
      (material) => material.bookedQuantity < material.requiredQuantity,
    );

    if (incomplete) {
      throw new BadRequestException(
        `All materials must be fully booked before release. Component ${incomplete.componentItemCode} is short.`,
      );
    }

    const firstQueuedOperation = [...workOrder.workOrderOperations]
      .sort((left, right) => {
        if (left.sequence !== right.sequence) {
          return left.sequence - right.sequence;
        }

        return left.id - right.id;
      })
      .find((operation) => operation.status === 'queued');

    if (!firstQueuedOperation) {
      throw new BadRequestException(
        `Manufacturing order ${this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'manufacturing_orders',
          workOrder.id,
        )} has no queued operations to release.`,
      );
    }

    await this.runWithOptionalTransaction(async (tx) => {
      await tx.workOrder.update({
        where: { id },
        data: {
          status: 'released',
          releasedAt: new Date(),
          assignedWorkstation:
            workOrder.assignedWorkstation ?? firstQueuedOperation.workstation ?? null,
        },
      });

      await tx.workOrderOperation.update({
        where: { id: firstQueuedOperation.id },
        data: {
          status: 'ready',
          assignedOperatorId:
            firstQueuedOperation.assignedOperatorId ?? workOrder.assignedOperatorId ?? null,
        },
      });

      if (workOrder.salesOrderLine?.salesOrder?.status === 'released') {
        await tx.salesOrder.update({
          where: { id: workOrder.salesOrderLine.salesOrderId },
          data: {
            status: 'in_production',
          },
        });

        await tx.salesOrderAudit.create({
          data: {
            salesOrderId: workOrder.salesOrderLine.salesOrderId,
            action: 'status_transition',
            fromStatus: 'released',
            toStatus: 'in_production',
            actor: 'system',
          },
        });
      }

      await this.appendHistory(
        tx,
        id,
        'released',
        'system',
        `Manufacturing order ${this.numberingService.formatFromSnapshot(
          numberingSnapshot,
          'manufacturing_orders',
          id,
        )} released and operation ${firstQueuedOperation.sequence} is ready.`,
      );
    });

    return this.findOne(id);
  }

  async upsertMaterialBooking(
    workOrderId: number,
    payload: UpsertMaterialBookingDto,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.getWorkOrderOrThrow(workOrderId);
    const bomItem = (workOrder.bom?.bomItems ?? []).find((entry) => entry.id === payload.bomItemId);

    if (!bomItem) {
      throw new NotFoundException(
        `BOM item ${payload.bomItemId} is not available on manufacturing order ${workOrderId}`,
      );
    }

    const stockLot = await this.prisma.stockLot.findUnique({
      where: { id: payload.stockLotId },
    });

    if (!stockLot) {
      throw new NotFoundException(`Stock lot ${payload.stockLotId} not found`);
    }

    if (stockLot.itemId !== bomItem.itemId) {
      throw new BadRequestException(
        `Stock lot ${stockLot.id} does not belong to component item ${bomItem.itemId}`,
      );
    }

    const availableLots = await this.buildAvailableLots([bomItem.itemId]);
    const selectedLot = availableLots.find((lot) => lot.id === stockLot.id);
    if (!selectedLot) {
      throw new BadRequestException(`Stock lot ${stockLot.id} is not available for booking`);
    }

    const existing = workOrder.materialBookings.find(
      (booking) =>
        booking.bomItemId === payload.bomItemId && booking.stockLotId === payload.stockLotId,
    );
    const currentlyBooked = existing?.quantity ?? 0;
    const effectiveAvailable = selectedLot.availableQuantity + currentlyBooked;

    if (payload.quantity > effectiveAvailable) {
      throw new BadRequestException(
        `Booking quantity ${payload.quantity} exceeds available lot quantity ${effectiveAvailable}`,
      );
    }

    await this.runWithOptionalTransaction(async (tx) => {
      if (existing) {
        await tx.materialBooking.update({
          where: { id: existing.id },
          data: {
            quantity: payload.quantity,
            consumedAt: null,
          },
        });
      } else {
        await tx.materialBooking.create({
          data: {
            workOrderId,
            bomItemId: payload.bomItemId,
            stockLotId: payload.stockLotId,
            quantity: payload.quantity,
          },
        });
      }

      await this.appendHistory(
        tx,
        workOrderId,
        'booking',
        'system',
        `Booked ${payload.quantity} from lot ${stockLot.lotNumber} for component ${bomItem.item.code ?? buildItemCode(bomItem.item.id)}.`,
      );
    });

    return this.findOne(workOrderId);
  }

  async updateMaterialBooking(
    workOrderId: number,
    bookingId: number,
    payload: UpdateMaterialBookingDto,
  ): Promise<WorkOrderDetailResponseDto> {
    const workOrder = await this.getWorkOrderOrThrow(workOrderId);
    const booking = workOrder.materialBookings.find((entry) => entry.id === bookingId);

    if (!booking) {
      throw new NotFoundException(
        `Material booking ${bookingId} not found on manufacturing order ${workOrderId}`,
      );
    }

    return this.upsertMaterialBooking(workOrderId, {
      bomItemId: booking.bomItemId,
      stockLotId: booking.stockLotId,
      quantity: payload.quantity,
    });
  }

  async listOperationQueue(): Promise<OperationQueueResponseDto[]> {
    const queuedOperations = await this.prisma.workOrderOperation.findMany({
      where: {
        status: {
          in: ['ready', 'queued', 'running', 'paused'],
        },
      },
      include: OPERATION_INCLUDE,
      orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
    });
    const numberingSnapshot = await this.numberingService.getSnapshot();

    return queuedOperations.map((operation) =>
      this.mapOperationQueue(operation, numberingSnapshot),
    );
  }

  async findOperationOne(id: number): Promise<OperationDetailResponseDto> {
    const operation = await this.getOperationOrThrow(id);
    return this.mapOperationDetail(
      operation,
      await this.numberingService.getSnapshot(),
    );
  }

  async updateOperation(
    id: number,
    payload: UpdateOperationDto,
  ): Promise<OperationDetailResponseDto> {
    await this.ensureAssignedOperatorExists(payload.assignedOperatorId);

    const operation = await this.getOperationOrThrow(id);
    const updated = await this.prisma.workOrderOperation.update({
      where: { id },
      data: {
        assignedOperatorId: payload.assignedOperatorId,
      },
    });

    await this.appendHistory(
      this.prisma,
      operation.workOrderId,
      'operation_assignment',
      'system',
      `Operation ${operation.sequence} assigned to user ${payload.assignedOperatorId}.`,
    );

    return this.findOperationOne(updated.id);
  }

  async startOperation(id: number): Promise<OperationDetailResponseDto> {
    const operation = await this.getOperationOrThrow(id);

    if (!['ready', 'paused'].includes(operation.status)) {
      throw new BadRequestException(
        `Invalid operation status transition: ${operation.status} -> running`,
      );
    }

    await this.runWithOptionalTransaction(async (tx) => {
      await tx.workOrderOperation.update({
        where: { id },
        data: {
          status: 'running',
          startedAt: operation.startedAt ?? new Date(),
          pausedAt: null,
        },
      });

      if (operation.workOrder.status === 'released') {
        await tx.workOrder.update({
          where: { id: operation.workOrderId },
          data: {
            status: 'in_progress',
          },
        });
      }

      await this.appendHistory(
        tx,
        operation.workOrderId,
        operation.status === 'paused' ? 'operation_resumed' : 'operation_started',
        'system',
        `Operation ${operation.sequence} ${operation.status === 'paused' ? 'resumed' : 'started'}.`,
      );
    });

    return this.findOperationOne(id);
  }

  async pauseOperation(id: number): Promise<OperationDetailResponseDto> {
    const operation = await this.getOperationOrThrow(id);

    if (operation.status !== 'running') {
      throw new BadRequestException(
        `Invalid operation status transition: ${operation.status} -> paused`,
      );
    }

    await this.prisma.workOrderOperation.update({
      where: { id },
      data: {
        status: 'paused',
        pausedAt: new Date(),
      },
    });

    await this.appendHistory(
      this.prisma,
      operation.workOrderId,
      'operation_paused',
      'system',
      `Operation ${operation.sequence} paused.`,
    );

    return this.findOperationOne(id);
  }

  async completeOperation(
    id: number,
    payload: CompleteOperationDto = {},
  ): Promise<OperationDetailResponseDto> {
    const operation = await this.getOperationOrThrow(id);
    const numberingSnapshot = await this.numberingService.getSnapshot();

    if (operation.status !== 'running') {
      throw new BadRequestException(
        `Invalid operation status transition: ${operation.status} -> completed`,
      );
    }

    const goodQuantity = payload.goodQuantity ?? operation.plannedQuantity;
    const scrapQuantity = payload.scrapQuantity ?? 0;

    if (goodQuantity + scrapQuantity !== operation.plannedQuantity) {
      throw new BadRequestException(
        `Completion quantities must total the planned quantity ${operation.plannedQuantity}.`,
      );
    }

    await this.runWithOptionalTransaction(async (tx) => {
      await tx.workOrderOperation.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          goodQuantity,
          scrapQuantity,
        },
      });

      const siblingOperations = await tx.workOrderOperation.findMany({
        where: { workOrderId: operation.workOrderId },
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
      });

      const nextOperation = siblingOperations.find(
        (candidate: {
          id: number;
          sequence: number;
          status: string;
          assignedOperatorId: number | null;
        }) =>
          candidate.id !== id &&
          (candidate.sequence > operation.sequence ||
            (candidate.sequence === operation.sequence && candidate.id > operation.id)),
      );

      if (nextOperation) {
        await tx.workOrder.update({
          where: { id: operation.workOrderId },
          data: {
            status: 'in_progress',
          },
        });

        if (nextOperation.status === 'queued') {
          await tx.workOrderOperation.update({
            where: { id: nextOperation.id },
            data: {
              status: 'ready',
              plannedQuantity: goodQuantity,
              assignedOperatorId:
                nextOperation.assignedOperatorId ??
                operation.assignedOperatorId ??
                operation.workOrder.assignedOperatorId ??
                null,
            },
          });
        }
      } else {
        const activeBookings: Prisma.MaterialBookingGetPayload<{
          include: { stockLot: true };
        }>[] = await tx.materialBooking.findMany({
          where: {
            workOrderId: operation.workOrderId,
            consumedAt: null,
          },
          include: {
            stockLot: true,
          },
        });

        for (const booking of activeBookings) {
          await tx.stockLot.update({
            where: { id: booking.stockLotId },
            data: {
              quantityOnHand: Math.max(0, booking.stockLot.quantityOnHand - booking.quantity),
              status:
                booking.stockLot.quantityOnHand - booking.quantity > 0
                  ? 'available'
                  : 'exhausted',
            },
          });

          await this.inventoryService.recordTransaction(
            {
              itemId: booking.stockLot.itemId,
              stockLotId: booking.stockLotId,
              transactionType: 'material_consumption',
              quantity: -booking.quantity,
              referenceType: 'manufacturing_order',
              referenceId: operation.workOrderId,
              referenceNumber: this.numberingService.formatFromSnapshot(
                numberingSnapshot,
                'manufacturing_orders',
                operation.workOrderId,
              ),
              transactionDate: new Date(),
              notes: `Consumed ${booking.quantity} from ${booking.stockLot.lotNumber}.`,
            },
            tx,
          );

          await tx.materialBooking.update({
            where: { id: booking.id },
            data: {
              consumedAt: new Date(),
            },
          });
        }

        let finishedGoodsLotId = operation.workOrder.finishedGoodsLotId ?? null;
        if (goodQuantity > 0) {
          if (finishedGoodsLotId) {
            await tx.stockLot.update({
              where: { id: finishedGoodsLotId },
              data: {
                quantityOnHand: {
                  increment: goodQuantity,
                },
                receivedAt: new Date(),
                sourceType: 'manufacturing_order',
                sourceReference: this.numberingService.formatFromSnapshot(
                  numberingSnapshot,
                  'manufacturing_orders',
                  operation.workOrderId,
                ),
                status: 'available',
              },
            });
          } else {
            const finishedItemId =
              operation.workOrder.itemId ?? operation.workOrder.salesOrderLine?.itemId;
            if (!finishedItemId) {
              throw new BadRequestException(
                `Manufacturing order ${operation.workOrderId} has no item for finished goods`,
              );
            }
            const createdLot = await tx.stockLot.create({
              data: {
                itemId: finishedItemId,
                lotNumber: this.numberingService.formatFromSnapshot(
                  numberingSnapshot,
                  'lots',
                  operation.workOrderId,
                ),
                quantityOnHand: goodQuantity,
                notes: `Finished goods from ${this.numberingService.formatFromSnapshot(
                  numberingSnapshot,
                  'manufacturing_orders',
                  operation.workOrderId,
                )}.`,
                receivedAt: new Date(),
                sourceType: 'manufacturing_order',
                sourceReference: this.numberingService.formatFromSnapshot(
                  numberingSnapshot,
                  'manufacturing_orders',
                  operation.workOrderId,
                ),
                status: 'available',
                sourceWorkOrderId: operation.workOrderId,
              },
            });
            finishedGoodsLotId = createdLot.id;
          }

          const finishedItemId =
            operation.workOrder.itemId ?? operation.workOrder.salesOrderLine?.itemId;
          if (!finishedItemId) {
            throw new BadRequestException(
              `Manufacturing order ${operation.workOrderId} has no item for finished output`,
            );
          }
          await this.inventoryService.recordTransaction(
            {
              itemId: finishedItemId,
              stockLotId: finishedGoodsLotId,
              transactionType: 'finished_output',
              quantity: goodQuantity,
              referenceType: 'manufacturing_order',
              referenceId: operation.workOrderId,
              referenceNumber: this.numberingService.formatFromSnapshot(
                numberingSnapshot,
                'manufacturing_orders',
                operation.workOrderId,
              ),
              transactionDate: new Date(),
              notes: `Finished output from ${this.numberingService.formatFromSnapshot(
                numberingSnapshot,
                'manufacturing_orders',
                operation.workOrderId,
              )}.`,
            },
            tx,
          );
        }

        await tx.workOrder.update({
          where: { id: operation.workOrderId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            finishedGoodsLotId,
          },
        });

        const affectedComponentItemIds = Array.from(
          new Set<number>(activeBookings.map((booking) => booking.stockLot.itemId)),
        );
        for (const itemId of affectedComponentItemIds) {
          await this.inventoryService.syncInventoryItemQuantity(itemId, tx);
        }
        const finishedItemId =
          operation.workOrder.itemId ?? operation.workOrder.salesOrderLine?.itemId;
        if (finishedItemId) {
          await this.inventoryService.syncInventoryItemQuantity(finishedItemId, tx);
        }
      }

      await this.appendHistory(
        tx,
        operation.workOrderId,
        'operation_completed',
        'system',
        `Operation ${operation.sequence} completed with good ${goodQuantity} and scrap ${scrapQuantity}.`,
      );
    });

    return this.findOperationOne(id);
  }

  async findReworkOperationBySource(
    sourceOperationId: number,
  ): Promise<OperationDetailResponseDto | null> {
    const operation = await this.prisma.workOrderOperation.findUnique({
      where: { reworkSourceOperationId: sourceOperationId },
      include: OPERATION_INCLUDE,
    });

    if (!operation) {
      return null;
    }

    return this.mapOperationDetail(
      operation,
      await this.numberingService.getSnapshot(),
    );
  }

  async createReworkOperation(
    sourceOperationId: number,
    plannedQuantity: number,
  ): Promise<OperationDetailResponseDto> {
    if (plannedQuantity <= 0) {
      throw new BadRequestException('Rework operation quantity must be greater than zero');
    }

    const sourceOperation = await this.getOperationOrThrow(sourceOperationId);

    if (sourceOperation.status !== 'completed') {
      throw new BadRequestException(
        `Rework operations can only be created from completed operations. Current status: ${sourceOperation.status}`,
      );
    }

    const existing = await this.prisma.workOrderOperation.findUnique({
      where: { reworkSourceOperationId: sourceOperationId },
    });

    if (existing) {
      throw new BadRequestException(
        `Rework operation already exists for operation ${sourceOperationId}`,
      );
    }

    const created = await this.prisma.workOrderOperation.create({
      data: {
        workOrderId: sourceOperation.workOrderId,
        routingOperationId: sourceOperation.routingOperationId,
        sequence: sourceOperation.sequence,
        plannedQuantity,
        status: 'ready',
        workstation: sourceOperation.workstation ?? null,
        assignedOperatorId:
          sourceOperation.assignedOperatorId ?? sourceOperation.workOrder.assignedOperatorId ?? null,
        reworkSourceOperationId: sourceOperationId,
      },
    });

    await this.appendHistory(
      this.prisma,
      sourceOperation.workOrderId,
      'rework_created',
      'system',
      `Rework operation created from operation ${sourceOperation.sequence}.`,
    );

    return this.findOperationOne(created.id);
  }

  async listProductionLogs(operationId: number): Promise<ProductionLogResponseDto[]> {
    const operation = await this.prisma.workOrderOperation.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    return this.prisma.productionLog.findMany({
      where: { operationId },
      orderBy: { id: 'asc' },
    });
  }

  async createProductionLog(
    operationId: number,
    payload: CreateProductionLogDto,
  ): Promise<ProductionLogResponseDto> {
    const operation = await this.prisma.workOrderOperation.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    if (operation.status !== 'running') {
      throw new BadRequestException(
        `Production logs can only be recorded for running operations. Current status: ${operation.status}`,
      );
    }

    return this.prisma.productionLog.create({
      data: {
        operationId,
        quantity: payload.quantity,
        notes: payload.notes?.trim() || null,
      },
    });
  }

  async getRecordedProductionQuantity(operationId: number): Promise<number> {
    const operation = await this.prisma.workOrderOperation.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    const aggregate = await this.prisma.productionLog.aggregate({
      where: { operationId },
      _sum: { quantity: true },
    });

    return aggregate._sum.quantity ?? 0;
  }

  private async getWorkOrderOrThrow(id: number): Promise<WorkOrderRecord> {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: WORK_ORDER_DETAIL_INCLUDE,
    });

    if (!workOrder) {
      throw new NotFoundException(`Manufacturing order ${id} not found`);
    }

    return workOrder;
  }

  private async getOperationOrThrow(id: number): Promise<WorkOrderOperationRecord> {
    const operation = await this.prisma.workOrderOperation.findUnique({
      where: { id },
      include: OPERATION_INCLUDE,
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${id} not found`);
    }

    return operation;
  }

  private async ensureAssignedOperatorExists(userId?: number): Promise<void> {
    if (!userId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  private async runWithOptionalTransaction<T>(
    callback: (transactionalPrisma: any) => Promise<T>,
  ): Promise<T> {
    const prismaWithOptionalTransaction = this.prisma as PrismaExecutor;
    const transaction = prismaWithOptionalTransaction.$transaction as
      | ((handler: (transactionalPrisma: any) => Promise<T>) => Promise<T>)
      | undefined;

    if (typeof transaction === 'function') {
      return transaction.call(this.prisma, callback);
    }

    return callback(this.prisma);
  }

  private async appendHistory(
    prisma: any,
    workOrderId: number,
    eventType: string,
    actor: string,
    message: string,
  ): Promise<void> {
    if (!prisma?.workOrderHistory?.create) {
      return;
    }

    await prisma.workOrderHistory.create({
      data: {
        workOrderId,
        eventType,
        actor,
        message,
      },
    });
  }

  private async toWorkOrderDetailResponse(
    workOrder: WorkOrderRecord,
    numberingSnapshot: NumberingSnapshot,
  ): Promise<WorkOrderDetailResponseDto> {
    const materials = await this.buildMaterialRequirements(workOrder);
    const response = await this.toWorkOrderResponse(workOrder, numberingSnapshot);
    const workOrderOperations = this.getWorkOrderOperations(workOrder);
    const historyEntries = this.getHistoryEntries(workOrder);
    const producedQuantity = workOrderOperations.reduce(
      (sum, operation) => sum + (operation.goodQuantity ?? 0),
      0,
    );
    const scrapQuantity = workOrderOperations.reduce(
      (sum, operation) => sum + (operation.scrapQuantity ?? 0),
      0,
    );

    return {
      ...response,
      notes: workOrder.notes ?? null,
      producedQuantity,
      scrapQuantity,
      finishedGoodsLotId: workOrder.finishedGoodsLot?.id ?? null,
      materials,
      operations: workOrderOperations.map((operation) =>
        this.toOperationSummary(operation, workOrder.assignedOperator),
      ),
      history: historyEntries.map((entry) => ({
        id: entry.id,
        eventType: entry.eventType,
        actor: entry.actor,
        message: entry.message,
        createdAt: entry.createdAt,
      })),
    };
  }

  private async toWorkOrderResponse(
    workOrder: WorkOrderRecord,
    numberingSnapshot: NumberingSnapshot,
  ): Promise<WorkOrderResponseDto> {
    const workOrderOperations = this.getWorkOrderOperations(workOrder);
    const salesOrderLine =
      workOrder.salesOrderLine ??
      (
        await this.prisma.workOrder.findUnique({
          where: { id: workOrder.id },
          include: {
            salesOrderLine: true,
          },
        })
      )?.salesOrderLine;

    const effectiveItemId = workOrder.itemId ?? salesOrderLine?.itemId;
    if (!effectiveItemId) {
      throw new NotFoundException(
        `Manufacturing order ${workOrder.id} is missing item (no sales-order line or itemId)`,
      );
    }

    const salesOrderLineWithRelations = salesOrderLine as
      | (typeof salesOrderLine & {
          item?: { code: string | null; name: string };
          salesOrder?: { customerId: number; customer?: { name: string } };
        })
      | null;

    const [item, salesOrder, routing] = await Promise.all([
      workOrder.item ??
        salesOrderLineWithRelations?.item ??
        this.prisma.item.findUnique({
          where: { id: effectiveItemId },
          select: ITEM_SELECT,
        }),
      salesOrderLineWithRelations?.salesOrder ??
        (salesOrderLine
          ? this.prisma.salesOrder.findUnique({
              where: { id: salesOrderLine.salesOrderId },
              include: { customer: { select: { id: true, name: true, code: true } } },
            })
          : null),
      workOrder.routing ??
        this.prisma.routing.findUnique({
          where: { id: workOrder.routingId },
          select: {
            id: true,
            code: true,
            name: true,
          },
        }),
    ]);
    const customerId = salesOrder?.customerId ?? workOrder.salesOrderLine?.salesOrder?.customerId ?? 0;
    const customer =
      workOrder.salesOrderLine?.salesOrder?.customer ??
      (customerId
        ? await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: {
              id: true,
              name: true,
              code: true,
            },
          })
        : null);
    const currentOperation =
      [...workOrderOperations]
        .sort((left, right) => {
          if (left.sequence !== right.sequence) {
            return left.sequence - right.sequence;
          }

          return left.id - right.id;
        })
        .find((operation) => operation.status !== 'completed') ?? null;
    const bookingCompletenessPercent = this.calculateBookingCompleteness(workOrder);
    const assignedOperator =
      currentOperation?.assignedOperator ?? workOrder.assignedOperator ?? null;

    const salesOrderId = salesOrderLine?.salesOrderId ?? 0;
    const salesOrderLineId = workOrder.salesOrderLineId ?? 0;

    return {
      id: workOrder.id,
      documentNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'manufacturing_orders',
        workOrder.id,
      ),
      salesOrderId,
      salesOrderNumber: salesOrderId
        ? this.numberingService.formatFromSnapshot(
            numberingSnapshot,
            'sales_orders',
            salesOrderId,
          )
        : '-',
      salesOrderLineId,
      itemId: effectiveItemId,
      itemCode: item?.code ?? buildItemCode(effectiveItemId),
      itemName: item?.name ?? `Item ${effectiveItemId}`,
      customerId,
      customerName: customer?.name ?? 'Direct',
      bomId: workOrder.bomId ?? null,
      bomName: workOrder.bom?.name ?? null,
      routingId: workOrder.routingId,
      routingName: routing?.name ?? `Routing ${workOrder.routingId}`,
      quantity: workOrder.quantity,
      dueDate: workOrder.dueDate ?? null,
      status: workOrder.status,
      releaseState: workOrder.releasedAt ? 'released' : 'pending',
      currentOperationId: currentOperation?.id ?? null,
      currentOperationName: currentOperation?.routingOperation?.name ?? null,
      currentWorkstation: currentOperation?.workstation ?? workOrder.assignedWorkstation ?? null,
      assignedOperatorId: assignedOperator?.id ?? null,
      assignedOperatorName: assignedOperator?.name ?? null,
      assignedWorkstation: workOrder.assignedWorkstation ?? null,
      bookingCompletenessPercent,
      finishedGoodsLotNumber: workOrder.finishedGoodsLot?.lotNumber ?? null,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt,
    };
  }

  private calculateBookingCompleteness(workOrder: WorkOrderRecord): number {
    const bomItems = workOrder.bom?.bomItems ?? [];
    const materialBookings = this.getMaterialBookings(workOrder);
    if (bomItems.length === 0) {
      return 100;
    }

    const requiredQuantity = bomItems.reduce(
      (sum, bomItem) => sum + bomItem.quantity * workOrder.quantity,
      0,
    );
    if (requiredQuantity === 0) {
      return 100;
    }

    const bookedQuantity = materialBookings
      .filter((booking) => booking.consumedAt === null)
      .reduce((sum, booking) => sum + booking.quantity, 0);

    return Math.max(0, Math.min(100, Math.round((bookedQuantity / requiredQuantity) * 100)));
  }

  private async buildMaterialRequirements(
    workOrder: WorkOrderRecord,
  ): Promise<MaterialRequirementResponseDto[]> {
    const bomItems = workOrder.bom?.bomItems ?? [];
    const materialBookings = this.getMaterialBookings(workOrder);
    if (bomItems.length === 0) {
      return [];
    }

    const componentItemIds = Array.from(new Set(bomItems.map((bomItem) => bomItem.itemId)));
    const availableLots = await this.buildAvailableLots(componentItemIds);

    return bomItems.map((bomItem) => {
      const bookings = materialBookings.filter(
        (booking) => booking.bomItemId === bomItem.id && booking.consumedAt === null,
      );
      const availableLotsForItem = availableLots
        .filter((lot) => lot.itemId === bomItem.itemId)
        .map((lot) => ({
          id: lot.id,
          lotNumber: lot.lotNumber,
          availableQuantity: lot.availableQuantity,
        }));
      const bookedQuantity = bookings.reduce((sum, booking) => sum + booking.quantity, 0);

      return {
        bomItemId: bomItem.id,
        rowOrder: bomItem.rowOrder,
        componentItemId: bomItem.itemId,
        componentItemCode: bomItem.item.code ?? buildItemCode(bomItem.item.id),
        componentItemName: bomItem.item.name,
        unitOfMeasure: bomItem.item.unitOfMeasure ?? 'pcs',
        requiredQuantity: bomItem.quantity * workOrder.quantity,
        bookedQuantity,
        availableQuantity: availableLotsForItem.reduce(
          (sum, lot) => sum + lot.availableQuantity,
          0,
        ),
        notes: bomItem.notes ?? null,
        bookings: bookings.map((booking) => this.toMaterialBookingResponse(booking)),
        availableLots: availableLotsForItem,
      };
    });
  }

  private getWorkOrderOperations(
    workOrder: WorkOrderRecord,
  ): WorkOrderRecord['workOrderOperations'] {
    return Array.isArray(workOrder.workOrderOperations) ? workOrder.workOrderOperations : [];
  }

  private getMaterialBookings(workOrder: WorkOrderRecord): WorkOrderRecord['materialBookings'] {
    return Array.isArray(workOrder.materialBookings) ? workOrder.materialBookings : [];
  }

  private getHistoryEntries(workOrder: WorkOrderRecord): WorkOrderRecord['historyEntries'] {
    return Array.isArray(workOrder.historyEntries) ? workOrder.historyEntries : [];
  }

  private async buildAvailableLots(componentItemIds: number[]): Promise<
    Array<
      MaterialRequirementAvailableLotResponseDto & {
        itemId: number;
      }
    >
  > {
    if (componentItemIds.length === 0) {
      return [];
    }

    const stockLots = await this.prisma.stockLot.findMany({
      where: {
        itemId: {
          in: componentItemIds,
        },
      },
      orderBy: [{ lotNumber: 'asc' }],
    });

    const lotIds = stockLots.map((lot) => lot.id);
    const activeBookings =
      lotIds.length > 0
        ? await this.prisma.materialBooking.findMany({
            where: {
              stockLotId: {
                in: lotIds,
              },
              consumedAt: null,
            },
            select: {
              stockLotId: true,
              quantity: true,
            },
          })
        : [];

    const reservedByLot = new Map<number, number>();
    for (const booking of activeBookings) {
      reservedByLot.set(
        booking.stockLotId,
        (reservedByLot.get(booking.stockLotId) ?? 0) + booking.quantity,
      );
    }

    return stockLots.map((lot) => ({
      id: lot.id,
      itemId: lot.itemId,
      lotNumber: lot.lotNumber,
      availableQuantity: Math.max(0, lot.quantityOnHand - (reservedByLot.get(lot.id) ?? 0)),
    }));
  }

  private toMaterialBookingResponse(booking: {
    id: number;
    bomItemId: number;
    stockLotId: number;
    quantity: number;
    consumedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    stockLot: {
      lotNumber: string;
    };
  }): MaterialBookingResponseDto {
    return {
      id: booking.id,
      bomItemId: booking.bomItemId,
      stockLotId: booking.stockLotId,
      lotNumber: booking.stockLot.lotNumber,
      quantity: booking.quantity,
      consumedAt: booking.consumedAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private toOperationSummary(
    operation: WorkOrderRecord['workOrderOperations'][number],
    workOrderAssignedOperator: WorkOrderRecord['assignedOperator'],
  ): OperationSummaryResponseDto {
    const assignedOperator = operation.assignedOperator ?? workOrderAssignedOperator ?? null;
    const completionSummary =
      operation.goodQuantity !== null && operation.goodQuantity !== undefined
        ? `Good ${operation.goodQuantity} / Scrap ${operation.scrapQuantity ?? 0}`
        : null;

    return {
      id: operation.id,
      routingOperationId: operation.routingOperationId,
      sequence: operation.sequence,
      operationName: operation.routingOperation.name,
      description: operation.routingOperation.description ?? null,
      workstation: operation.workstation ?? operation.routingOperation.workstation ?? null,
      assignedOperatorId: assignedOperator?.id ?? null,
      assignedOperatorName: assignedOperator?.name ?? null,
      status: operation.status,
      plannedQuantity: operation.plannedQuantity,
      goodQuantity: operation.goodQuantity ?? null,
      scrapQuantity: operation.scrapQuantity ?? null,
      completionSummary,
    };
  }

  private mapOperationQueue(
    operation: WorkOrderOperationRecord,
    numberingSnapshot: NumberingSnapshot,
  ): OperationQueueResponseDto {
    const assignedOperator = operation.assignedOperator ?? operation.workOrder.assignedOperator ?? null;
    const effectiveItem =
      operation.workOrder.item ??
      operation.workOrder.salesOrderLine?.item;
    const effectiveItemId =
      operation.workOrder.itemId ?? operation.workOrder.salesOrderLine?.itemId ?? 0;
    const itemCode =
      effectiveItem?.code ?? buildItemCode(effectiveItemId);
    const itemName =
      effectiveItem?.name ?? `Item ${effectiveItemId}`;
    const operationName =
      operation.routingOperation?.name ?? `Operation ${operation.sequence}`;
    const workstation =
      operation.workstation ?? operation.routingOperation?.workstation ?? null;

    return {
      id: operation.id,
      workOrderId: operation.workOrderId,
      workOrderNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'manufacturing_orders',
        operation.workOrderId,
      ),
      salesOrderId: operation.workOrder.salesOrderLine?.salesOrderId ?? 0,
      salesOrderLineId: operation.workOrder.salesOrderLineId ?? 0,
      itemId: effectiveItemId,
      itemCode,
      itemName,
      routingOperationId: operation.routingOperationId,
      operationName,
      workstation,
      assignedOperatorId: assignedOperator?.id ?? null,
      assignedOperatorName: assignedOperator?.name ?? null,
      sequence: operation.sequence,
      plannedQuantity: operation.plannedQuantity,
      status: operation.status,
    };
  }

  private mapOperationDetail(
    operation: WorkOrderOperationRecord,
    numberingSnapshot: NumberingSnapshot,
  ): OperationDetailResponseDto {
    const assignedOperator = operation.assignedOperator ?? operation.workOrder.assignedOperator ?? null;
    const effectiveItem =
      operation.workOrder.item ??
      operation.workOrder.salesOrderLine?.item;
    const effectiveItemId =
      operation.workOrder.itemId ?? operation.workOrder.salesOrderLine?.itemId ?? 0;
    const itemCode =
      effectiveItem?.code ?? buildItemCode(effectiveItemId);
    const itemName =
      effectiveItem?.name ?? `Item ${effectiveItemId}`;
    const routingName =
      operation.workOrder.routing?.name ?? `Routing ${operation.workOrder.routingId}`;
    const operationName =
      operation.routingOperation?.name ?? `Operation ${operation.sequence}`;
    const workstation =
      operation.workstation ?? operation.routingOperation?.workstation ?? null;

    return {
      id: operation.id,
      workOrderId: operation.workOrderId,
      workOrderNumber: this.numberingService.formatFromSnapshot(
        numberingSnapshot,
        'manufacturing_orders',
        operation.workOrderId,
      ),
      salesOrderId: operation.workOrder.salesOrderLine?.salesOrderId ?? 0,
      salesOrderLineId: operation.workOrder.salesOrderLineId ?? 0,
      itemId: effectiveItemId,
      itemCode,
      itemName,
      routingId: operation.workOrder.routingId,
      routingName,
      routingOperationId: operation.routingOperationId,
      operationName,
      workstation,
      assignedOperatorId: assignedOperator?.id ?? null,
      assignedOperatorName: assignedOperator?.name ?? null,
      sequence: operation.sequence,
      plannedQuantity: operation.plannedQuantity,
      goodQuantity: operation.goodQuantity ?? null,
      scrapQuantity: operation.scrapQuantity ?? null,
      status: operation.status,
      reworkSourceOperationId: operation.reworkSourceOperationId,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt,
    };
  }
}
