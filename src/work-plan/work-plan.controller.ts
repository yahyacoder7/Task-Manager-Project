import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkPlanService } from './work-plan.service';
import { CreateWorkPlanDto } from './dto/create-work-plan.dto';
import { UpdateWorkPlanDto } from './dto/update-work-plan.dto';

@Controller('work-plan')
export class WorkPlanController {
  constructor(private readonly workPlanService: WorkPlanService) {}

  @Post()
  create(@Body() createWorkPlanDto: CreateWorkPlanDto) {
    return this.workPlanService.create(createWorkPlanDto);
  }

  @Get()
  findAll() {
    return this.workPlanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workPlanService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkPlanDto: UpdateWorkPlanDto) {
    return this.workPlanService.update(+id, updateWorkPlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workPlanService.remove(+id);
  }
}
