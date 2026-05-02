import { Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTodoDto: CreateTodoDto, userId: number) {
    try {
      const todo = await this.prisma.todo.create({
        data: { ...createTodoDto, userId },
      });
      return todo;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll(userId: number) {
    try {
      const todos = await this.prisma.todo.findMany({
        where: { userId },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return todos;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findOne(todoId: number, userId: number) {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId, userId: userId },
        include: {
          category: true,
        },
      });
      if (!todo) {
        throw new BadRequestException('Todo not found');
      }
      return todo;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(todoId: number, updateTodoDto: UpdateTodoDto) {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId },
      });
      if (!todo) {
        throw new BadRequestException('Todo not found');
      }
      const updatedTodo = await this.prisma.todo.update({
        where: { todoId: todoId },
        data: updateTodoDto,
      });
      return updatedTodo;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(todoId: number) {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId },
      });
      if (!todo) {
        throw new BadRequestException('Todo not found');
      }
      const deletedTodo = await this.prisma.todo.delete({
        where: { todoId: todoId },
      });
      return deletedTodo;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async complete(todoId: number) {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId },
      });
      if (!todo) {
        throw new BadRequestException('Todo not found');
      }
      const repeatUitToDays = {
        DAILY: 1,
        WEEKLY: 7,
        MONTHLY: 30,
        YEARLY: 365,
      }
      const repeatInterval = repeatUitToDays[todo.repeatUnit] * todo.repeatInterval;
      await this.prisma.todo.create({
        where:{
          todoId: todo.todoId
        },
        data:{
          taskcompletions:{
            create:{
              completedAt: new Date(),
              todoId: todo.todoId,   
            }
          }
        }
      })
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
