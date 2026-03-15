import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import { WorkstationResponseDto } from './dto/workstation-response.dto';
import { UpdateWorkstationDto } from './dto/update-workstation.dto';
import { WorkstationsService } from './workstations.service';

@Controller('workstations')
@Roles('admin', 'planner', 'operator')
export class WorkstationsController {
  constructor(private readonly service: WorkstationsService) {}

  @Get()
  findAll(): Promise<WorkstationResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkstationResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'planner')
  create(@Body() payload: CreateWorkstationDto): Promise<WorkstationResponseDto> {
    return this.service.create(payload);
  }

  @Patch(':id')
  @Roles('admin', 'planner')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateWorkstationDto,
  ): Promise<WorkstationResponseDto> {
    return this.service.update(id, payload);
  }
}
