import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkPlanService } from './work-plan.service';
import { CreateWorkPlanDto } from './dto/create-work-plan.dto';
import { UpdateWorkPlanDto } from './dto/update-work-plan.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Work Plans')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('work-plan')
export class WorkPlanController {
  constructor(private readonly workPlanService: WorkPlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work plan' })
  @ApiResponse({ status: 201, description: 'Work plan created successfully.' })
  create(@Body() createWorkPlanDto: CreateWorkPlanDto, @Req() req: any) {
    return this.workPlanService.create(createWorkPlanDto, +req.user.sub);
  }

  @Get('get-all-work-plans')
  @ApiOperation({ summary: 'Get all work plans with progress summary' })
  findAll(@Req() req: any) {
    return this.workPlanService.getUserWorkPlansListWithProgress(+req.user.sub);
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get full details of a work plan including tasks and progress',
  })
  @ApiParam({ name: 'id', description: 'Work plan ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.workPlanService.getWorkPlanDetailsWithProgress(
      +req.user.sub,
      +id,
    );
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update work plan details or sync tasks' })
  @ApiParam({ name: 'id', description: 'Work plan ID to update' })
  update(
    @Param('id') id: string,
    @Body() updateWorkPlanDto: UpdateWorkPlanDto,
    @Req() req: any,
  ) {
    return this.workPlanService.update(+id, updateWorkPlanDto, +req.user.sub);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a work plan' })
  @ApiParam({ name: 'id', description: 'Work plan ID to delete' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.workPlanService.remove(+id, +req.user.sub);
  }

  @Patch('remove-todo/:todoId')
  @ApiOperation({ summary: 'Disconnect a task from its work plan' })
  @ApiParam({ name: 'todoId', description: 'ID of the task to make free' })
  removeTodo(@Param('todoId') todoId: string, @Req() req: any) {
    return this.workPlanService.removeTodoFromWorkPlan(+todoId, +req.user.sub);
  }

  @Patch('reorder/:id')
  @ApiOperation({ summary: 'Manually reorder tasks within a plan' })
  @ApiParam({ name: 'id', description: 'Work plan ID' })
  reorder(
    @Param('id') id: string,
    @Body('todoIds') todoIds: number[],
    @Req() req: any,
  ) {
    return this.workPlanService.reorderTodos(+id, todoIds, +req.user.sub);
  }
}
