import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateWorkstationGroupDto } from './dto/create-workstation-group.dto';
import { WorkstationGroupResponseDto } from './dto/workstation-group-response.dto';
import { UpdateWorkstationGroupDto } from './dto/update-workstation-group.dto';
import { WorkstationGroupsService } from './workstation-groups.service';

@Controller('workstation-groups')
@Roles('admin', 'planner', 'operator')
export class WorkstationGroupsController {
  constructor(private readonly service: WorkstationGroupsService) {}

  @Get()
  findAll(): Promise<WorkstationGroupResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkstationGroupResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'planner')
  create(@Body() payload: CreateWorkstationGroupDto): Promise<WorkstationGroupResponseDto> {
    return this.service.create(payload);
  }

  @Patch(':id')
  @Roles('admin', 'planner')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateWorkstationGroupDto,
  ): Promise<WorkstationGroupResponseDto> {
    return this.service.update(id, payload);
  }
}
