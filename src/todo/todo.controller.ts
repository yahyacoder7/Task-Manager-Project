import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';
@Controller('todo')
@UseGuards(AuthGuard)
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
    private prisma: PrismaService,
  ) {}

  @Post('add-todo')
  create(@Body() createTodoDto: CreateTodoDto, @Req() req: any) {
    return this.todoService.create(createTodoDto, req.user.sub);
  }

  @Get('get-all-todos')
  findAll(@Req() req:any) {
    return this.todoService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') todoId: string, @Req() req:any) {
    return this.todoService.findOne(+todoId, +req.user.sub);
  }

  @Patch('edit/:id')
  update(@Param('id') todoId: string, @Body() updateTodoDto: UpdateTodoDto, @Req() req: any) {
    return this.todoService.update(+todoId, updateTodoDto, +req.user.sub);
  }

  @Delete('delete/:id')
  remove(@Param('id') todoId: string, @Req() req:any) {
    return this.todoService.remove(+todoId, +req.user.sub);
  }

  @Patch('complete/:id')
  completeTodo(@Param('id') todoId: string, @Req() req:any) {
    return this.todoService.completeTodo(+todoId, +req.user.sub);
  }

  @Get('get-all-completed-todos/:period')
  getAllCompeletedTodos(@Param('period') period: string, @Req() req:any) {
    return this.todoService.getAllCompeletedTodos(+req.user.sub, period);
  }

  @Get('status/summary')
  @ApiOperation({ summary: 'Get total count of completed and incomplete tasks' })
  getTodoStats(@Req() req: any) {
    return this.todoService.getTodoStats(+req.user.sub);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get tasks by category ID' })
  @ApiParam({ name: 'categoryId', description: 'The ID of the category' })
  findByCategory(@Param('categoryId') categoryId: string, @Req() req: any) {
    return this.todoService.findByCategory(+categoryId, +req.user.sub);
  }
}
