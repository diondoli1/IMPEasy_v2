import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import { WorkstationResponseDto } from './dto/workstation-response.dto';
import { UpdateWorkstationDto } from './dto/update-workstation.dto';

@Injectable()
export class WorkstationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<WorkstationResponseDto[]> {
    const stations = await this.prisma.workstation.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    return stations.map((s) => this.toResponse(s));
  }

  async findOne(id: number): Promise<WorkstationResponseDto> {
    const station = await this.prisma.workstation.findUnique({
      where: { id },
    });
    if (!station) {
      throw new NotFoundException(`Workstation ${id} not found`);
    }
    return this.toResponse(station);
  }

  async create(payload: CreateWorkstationDto): Promise<WorkstationResponseDto> {
    const group = await this.prisma.workstationGroup.findUnique({
      where: { id: payload.workstationGroupId },
    });
    if (!group) {
      throw new NotFoundException(
        `Workstation group ${payload.workstationGroupId} not found`,
      );
    }
    const created = await this.prisma.workstation.create({
      data: {
        workstationGroupId: payload.workstationGroupId,
        code: payload.code?.trim() || null,
        name: payload.name.trim(),
        type: payload.type?.trim() || null,
        hourlyRate: payload.hourlyRate ?? 0,
      },
    });
    return this.toResponse(created);
  }

  async update(
    id: number,
    payload: UpdateWorkstationDto,
  ): Promise<WorkstationResponseDto> {
    await this.findOne(id);
    if (payload.workstationGroupId !== undefined) {
      const group = await this.prisma.workstationGroup.findUnique({
        where: { id: payload.workstationGroupId },
      });
      if (!group) {
        throw new NotFoundException(
          `Workstation group ${payload.workstationGroupId} not found`,
        );
      }
    }
    const updated = await this.prisma.workstation.update({
      where: { id },
      data: {
        workstationGroupId: payload.workstationGroupId,
        code: payload.code !== undefined ? (payload.code?.trim() || null) : undefined,
        name: payload.name?.trim(),
        type: payload.type !== undefined ? (payload.type?.trim() || null) : undefined,
        hourlyRate: payload.hourlyRate,
      },
    });
    return this.toResponse(updated);
  }

  private toResponse(s: {
    id: number;
    workstationGroupId: number;
    code: string | null;
    name: string;
    type: string | null;
    hourlyRate: number;
    createdAt: Date;
    updatedAt: Date;
  }): WorkstationResponseDto {
    return {
      id: s.id,
      workstationGroupId: s.workstationGroupId,
      code: s.code,
      name: s.name,
      type: s.type,
      hourlyRate: s.hourlyRate,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
