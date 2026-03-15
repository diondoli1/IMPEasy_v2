import type { Inspection } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { RecordInspectionResultDto } from './dto/record-inspection-result.dto';
import { RecordInspectionScrapDto } from './dto/record-inspection-scrap.dto';

export type ShipmentQualityClearance = {
  salesOrderLineId: number;
  qualityClearedQuantity: number;
};

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workOrdersService: WorkOrdersService,
  ) {}

  async findByOperation(operationId: number): Promise<InspectionResponseDto> {
    await this.workOrdersService.findOperationOne(operationId);

    const inspection = await this.prisma.inspection.findUnique({
      where: { operationId },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection for operation ${operationId} not found`);
    }

    return this.buildInspectionResponse(inspection);
  }

  async createForOperation(
    operationId: number,
    payload: CreateInspectionDto,
  ): Promise<InspectionResponseDto> {
    const operation = await this.workOrdersService.findOperationOne(operationId);

    if (operation.status !== 'completed') {
      throw new BadRequestException(
        `Inspection records can only be created for completed operations. Current status: ${operation.status}`,
      );
    }

    const existing = await this.prisma.inspection.findUnique({
      where: { operationId },
    });

    if (existing) {
      throw new BadRequestException(
        `Inspection for operation ${operationId} already exists`,
      );
    }

    const created = await this.prisma.inspection.create({
      data: {
        operationId,
        status: 'pending',
        notes: payload.notes?.trim() || null,
        passedQuantity: null,
        failedQuantity: null,
        reworkQuantity: null,
        scrappedQuantity: null,
        scrapNotes: null,
        scrappedAt: null,
      },
    });

    return this.buildInspectionResponse(created);
  }

  async recordResult(
    operationId: number,
    payload: RecordInspectionResultDto,
  ): Promise<InspectionResponseDto> {
    await this.workOrdersService.findOperationOne(operationId);

    const inspection = await this.getInspectionByOperationOrThrow(operationId);
    if (inspection.status !== 'pending') {
      throw new BadRequestException(
        `Inspection results can only be recorded for pending inspections. Current status: ${inspection.status}`,
      );
    }

    const producedQuantity = await this.workOrdersService.getRecordedProductionQuantity(operationId);
    if (producedQuantity <= 0) {
      throw new BadRequestException(
        `Inspection results require recorded production quantity for operation ${operationId}`,
      );
    }

    const totalInspectedQuantity =
      payload.passedQuantity + payload.failedQuantity + payload.reworkQuantity;

    if (totalInspectedQuantity <= 0) {
      throw new BadRequestException('Inspection result quantities must total more than zero');
    }

    if (totalInspectedQuantity !== producedQuantity) {
      throw new BadRequestException(
        `Inspection result quantities must total ${producedQuantity} for operation ${operationId}`,
      );
    }

    if (payload.status === 'passed') {
      if (
        payload.passedQuantity !== producedQuantity ||
        payload.failedQuantity !== 0 ||
        payload.reworkQuantity !== 0
      ) {
        throw new BadRequestException(
          'Passed inspections must allocate all recorded quantity to passed quantity only',
        );
      }
    }

    if (payload.status === 'failed') {
      if (payload.failedQuantity === 0 && payload.reworkQuantity === 0) {
        throw new BadRequestException(
          'Failed inspections must include failed quantity or rework quantity',
        );
      }
    }

    const updated = await this.prisma.inspection.update({
      where: { operationId },
      data: {
        status: payload.status,
        notes: this.resolveNotes(payload.notes, inspection.notes),
        passedQuantity: payload.passedQuantity,
        failedQuantity: payload.failedQuantity,
        reworkQuantity: payload.reworkQuantity,
      },
    });

    return this.buildInspectionResponse(updated);
  }

  async createReworkOperation(operationId: number): Promise<InspectionResponseDto> {
    await this.workOrdersService.findOperationOne(operationId);

    const inspection = await this.getInspectionByOperationOrThrow(operationId);
    if (!['failed', 'rework_required'].includes(inspection.status)) {
      throw new BadRequestException(
        `Rework workflow is allowed only for failed or rework_required inspections. Current status: ${inspection.status}`,
      );
    }

    if (!inspection.reworkQuantity || inspection.reworkQuantity <= 0) {
      throw new BadRequestException(
        `Inspection ${inspection.id} cannot create a rework operation without rework quantity`,
      );
    }

    const existingReworkOperation = await this.workOrdersService.findReworkOperationBySource(
      operationId,
    );
    if (existingReworkOperation) {
      throw new BadRequestException(
        `Rework operation already exists for inspection ${inspection.id}`,
      );
    }

    await this.workOrdersService.createReworkOperation(operationId, inspection.reworkQuantity);

    if (inspection.status === 'rework_required') {
      return this.buildInspectionResponse(inspection);
    }

    const updated = await this.prisma.inspection.update({
      where: { operationId },
      data: {
        status: 'rework_required',
      },
    });

    return this.buildInspectionResponse(updated);
  }

  async recordScrap(
    operationId: number,
    payload: RecordInspectionScrapDto,
  ): Promise<InspectionResponseDto> {
    await this.workOrdersService.findOperationOne(operationId);

    const inspection = await this.getInspectionByOperationOrThrow(operationId);
    if (!['failed', 'rework_required'].includes(inspection.status)) {
      throw new BadRequestException(
        `Scrap handling is allowed only for failed or rework_required inspections. Current status: ${inspection.status}`,
      );
    }

    if (!inspection.failedQuantity || inspection.failedQuantity <= 0) {
      throw new BadRequestException(
        `Inspection ${inspection.id} does not have failed quantity available for scrap handling`,
      );
    }

    if (inspection.scrappedQuantity !== null) {
      throw new BadRequestException(`Scrap has already been recorded for inspection ${inspection.id}`);
    }

    const updated = await this.prisma.inspection.update({
      where: { operationId },
      data: {
        scrappedQuantity: inspection.failedQuantity,
        scrapNotes: this.resolveNotes(payload.notes, null),
        scrappedAt: new Date(),
      },
    });

    return this.buildInspectionResponse(updated);
  }

  async listShipmentClearanceBySalesOrder(
    salesOrderId: number,
  ): Promise<ShipmentQualityClearance[]> {
    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        salesOrderLine: {
          salesOrderId,
        },
      },
      include: {
        workOrderOperations: {
          include: {
            inspection: true,
          },
          orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return workOrders
      .filter((w) => w.salesOrderLineId != null)
      .map((workOrder) => {
        const highestSequence = workOrder.workOrderOperations.reduce<number | null>(
          (currentMax, operation) =>
            currentMax === null || operation.sequence > currentMax ? operation.sequence : currentMax,
          null,
        );

        if (highestSequence === null) {
          return {
            salesOrderLineId: workOrder.salesOrderLineId as number,
            qualityClearedQuantity: 0,
          };
        }

        const qualityClearedQuantity = workOrder.workOrderOperations
          .filter((operation) => operation.sequence === highestSequence)
          .reduce((total, operation) => total + (operation.inspection?.passedQuantity ?? 0), 0);

        return {
          salesOrderLineId: workOrder.salesOrderLineId as number,
          qualityClearedQuantity,
        };
      });
  }

  private async getInspectionByOperationOrThrow(operationId: number): Promise<Inspection> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { operationId },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection for operation ${operationId} not found`);
    }

    return inspection;
  }

  private async buildInspectionResponse(inspection: Inspection): Promise<InspectionResponseDto> {
    const reworkOperation = await this.workOrdersService.findReworkOperationBySource(
      inspection.operationId,
    );

    return {
      ...inspection,
      reworkOperationId: reworkOperation?.id ?? null,
      reworkOperationStatus: reworkOperation?.status ?? null,
      reworkOperationSequence: reworkOperation?.sequence ?? null,
      reworkOperationPlannedQuantity: reworkOperation?.plannedQuantity ?? null,
      reworkCreatedAt: reworkOperation?.createdAt ?? null,
    };
  }

  private resolveNotes(nextNotes: string | undefined, currentNotes: string | null): string | null {
    if (nextNotes === undefined) {
      return currentNotes;
    }

    const trimmedNotes = nextNotes.trim();
    return trimmedNotes.length > 0 ? trimmedNotes : null;
  }
}
