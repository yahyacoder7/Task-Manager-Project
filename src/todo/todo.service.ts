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
        data: {
          ...updateTodoDto,
          notified: false,
        },
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

  async completeTodo(todoId: number) {
    try {
      let nextDate: Date | null = null;

      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId },
      });

      if (!todo) {
        throw new BadRequestException('Todo not found');
      }

      // this condition handle the case where the todo is repeated and has a start date or expected time
      if (
        todo.repeatUnit &&
        todo.repeatInterval && 
        todo.repeatInterval > 0
      ) {
        // calculate the next repeat date to adding it to the old start date
        if(todo.startDate){
        nextDate = todo.startDate;
        while (nextDate <= new Date()) {
          switch (todo.repeatUnit) {
            case 'DAILY':
              nextDate.setDate(nextDate.getDate() + todo.repeatInterval);
              break;
            case 'WEEKLY':
              nextDate.setDate(nextDate.getDate() + todo.repeatInterval * 7);
              break;
            case 'MONTHLY':
              nextDate.setMonth(nextDate.getMonth() + todo.repeatInterval);
              break;
            case 'YEARLY':
              nextDate.setFullYear(
                nextDate.getFullYear() + todo.repeatInterval,
              );
              break;
          }
        }
      }

        await this.prisma.todo.update({
          where: {
            todoId: todoId,
          },
          data: {
            startDate: todo.startDate ? nextDate : null,
            notified: false,

            taskcompletions: {
              create: {
                completedAt: new Date(),
              },
            },
          },
        });

        // this condition handle the case where the todo is not repeated
      } else {
        await this.prisma.todo.update({
          where: {
            todoId: todoId,
          },
          data: {
            isCompleted: true,
            taskcompletions: {
              create: {
                completedAt: new Date(),
              },
            },
          },
        });
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
