import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkstationGroupDto } from './dto/create-workstation-group.dto';
import { WorkstationGroupResponseDto } from './dto/workstation-group-response.dto';
import { UpdateWorkstationGroupDto } from './dto/update-workstation-group.dto';

@Injectable()
export class WorkstationGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<WorkstationGroupResponseDto[]> {
    const groups = await this.prisma.workstationGroup.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    return groups.map((g) => this.toResponse(g));
  }

  async findOne(id: number): Promise<WorkstationGroupResponseDto> {
    const group = await this.prisma.workstationGroup.findUnique({
      where: { id },
    });
    if (!group) {
      throw new NotFoundException(`Workstation group ${id} not found`);
    }
    return this.toResponse(group);
  }

  async create(payload: CreateWorkstationGroupDto): Promise<WorkstationGroupResponseDto> {
    const created = await this.prisma.workstationGroup.create({
      data: {
        code: payload.code?.trim() || null,
        name: payload.name.trim(),
        type: payload.type?.trim() || null,
        instanceCount: payload.instanceCount ?? 1,
        hourlyRate: payload.hourlyRate ?? 0,
      },
    });
    return this.toResponse(created);
  }

  async update(
    id: number,
    payload: UpdateWorkstationGroupDto,
  ): Promise<WorkstationGroupResponseDto> {
    await this.findOne(id);
    const updated = await this.prisma.workstationGroup.update({
      where: { id },
      data: {
        code: payload.code !== undefined ? (payload.code?.trim() || null) : undefined,
        name: payload.name?.trim(),
        type: payload.type !== undefined ? (payload.type?.trim() || null) : undefined,
        instanceCount: payload.instanceCount,
        hourlyRate: payload.hourlyRate,
      },
    });
    return this.toResponse(updated);
  }

  private toResponse(g: {
    id: number;
    code: string | null;
    name: string;
    type: string | null;
    instanceCount: number;
    hourlyRate: number;
    createdAt: Date;
    updatedAt: Date;
  }): WorkstationGroupResponseDto {
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      type: g.type,
      instanceCount: g.instanceCount,
      hourlyRate: g.hourlyRate,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }
}
