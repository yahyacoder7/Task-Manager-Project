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
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Todos')
@ApiBearerAuth()
@Controller('todo')
@UseGuards(AuthGuard)
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post('add-todo')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'The task has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  create(@Body() createTodoDto: CreateTodoDto, @Req() req: any) {
    return this.todoService.create(createTodoDto, +req.user.sub);
  }

  @Get('get-all-todos')
  @ApiOperation({ summary: 'Get all tasks for the current user' })
  findAll(@Req() req: any) {
    return this.todoService.findAll(+req.user.sub);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get tasks not assigned to any work plan' })
  getAvailableTodos(@Req() req: any) {
    return this.todoService.getAvailableTodos(+req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiParam({ name: 'id', description: 'The unique ID of the task' })
  @ApiResponse({ status: 200, description: 'Task found.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  findOne(@Param('id') todoId: string, @Req() req: any) {
    return this.todoService.findOne(+todoId, +req.user.sub);
  }

  @Patch('edit/:id')
  @ApiOperation({ summary: 'Update an existing task' })
  @ApiParam({ name: 'id', description: 'The ID of the task to update' })
  update(
    @Param('id') todoId: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Req() req: any,
  ) {
    return this.todoService.update(+todoId, updateTodoDto, +req.user.sub);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'The ID of the task to delete' })
  remove(@Param('id') todoId: string, @Req() req: any) {
    return this.todoService.remove(+todoId, +req.user.sub);
  }

  @Patch('complete/:id')
  @ApiOperation({ summary: 'Mark a task as completed' })
  @ApiParam({ name: 'id', description: 'The ID of the task to complete' })
  completeTodo(@Param('id') todoId: string, @Req() req: any) {
    return this.todoService.completeTodo(+todoId, +req.user.sub);
  }

  @Get('get-all-completed-todos/:period')
  @ApiOperation({ summary: 'Get completed tasks filtered by period' })
  @ApiParam({ name: 'period', enum: ['ALL', 'DAILY', 'WEEKLY', 'MONTHLY'], description: 'Time filter' })
  getAllCompeletedTodos(@Param('period') period: string, @Req() req: any) {
    return this.todoService.getAllCompeletedTodos(+req.user.sub, period);
  }
}
