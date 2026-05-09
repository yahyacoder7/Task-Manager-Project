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

  async update(todoId: number, updateTodoDto: UpdateTodoDto, userId: number) {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId, userId: userId },
      });
      if (!todo) {
        throw new BadRequestException('Todo not found');
      }
      // Check if time-related fields are changing to decide whether to reset notified status
      const isTimeChanged =
        (updateTodoDto.startDate !== undefined &&
          new Date(updateTodoDto.startDate).getTime() !==
            todo.startDate?.getTime()) ||
        (updateTodoDto.expectedTime !== undefined &&
          updateTodoDto.expectedTime !== todo.expectedTime);

      const updatedTodo = await this.prisma.todo.update({
        where: { todoId: todoId, userId: userId },
        data: {
          ...updateTodoDto,
          notified: isTimeChanged ? false : todo.notified,
          isCompleted: isTimeChanged ? false : todo.isCompleted,
        },
      });
      return updatedTodo;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(todoId: number, userId: number) {
    try {
      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId, userId: userId },
      });
      if (!todo) {
        throw new BadRequestException('Todo not found');
      }
      const deletedTodo = await this.prisma.todo.delete({
        where: { todoId: todoId, userId: userId },
      });
      return deletedTodo;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async completeTodo(todoId: number, userId: number) {
    try {
      let nextDate: Date | null = null;

      const todo = await this.prisma.todo.findUnique({
        where: { todoId: todoId, userId: userId },
      });

      if (!todo) {
        throw new BadRequestException('Todo not found');
      }
      if (todo.isCompleted) {
        throw new BadRequestException('Todo is already completed');
      }

      // this condition handle the case where the todo is repeated and has a start date or expected time
      if (todo.repeatUnit && todo.repeatInterval && todo.repeatInterval > 0) {
        // calculate the next repeat date to adding it to the old start date
        if (todo.startDate) {
          nextDate = new Date(todo.startDate);
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
        // here we update the todo and set the isCompleted to true and the notified to true if there is an expected time
        // and we also add the todo to the taskcompletions
        // and if there is a startDate or expectedTime we set the nextDate to the new startDate
        return await this.prisma.todo.update({
          where: {
            todoId: todoId,
            userId: userId,
          },
          data: {
            startDate: todo.startDate ? nextDate : null,
            isCompleted: true,
            notified: todo.expectedTime ? true : false,

            taskcompletions: {
              create: {
                completedAt: new Date(),
              },
            },
          },
        });

        // this condition handle the case where the todo is not repeated
      } else {
        return await this.prisma.todo.update({
          where: {
            todoId: todoId,
            userId: userId,
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

  async getAllCompeletedTodos(userId: number, period: string) {
    try {
      let now = new Date();
      switch (period) {
        case 'ALL':
          now = new Date(0);
          break;
        case 'DAILY':
          now.setHours(0, 0, 0, 0);
          break;
        case 'WEEKLY':
          now.setDate(now.getDate() - 7);
          break;
        case 'MONTHLY':
          now.setMonth(now.getMonth() - 1);
          break;
        default:
          throw new BadRequestException('Invalid period');
      }
      const todos = await this.prisma.todo.findMany({
        where: {
          userId,
          taskcompletions: {
            some: {
              completedAt: {
                gte: now,
              },
            },
          },
        },
        include: {
          category: true,
          taskcompletions: true,
          workplan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return todos;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getTodoStats(userId: number) {
    const [completed, incomplete] = await Promise.all([
      this.prisma.todo.count({ where: { userId, isCompleted: true } }),
      this.prisma.todo.count({ where: { userId, isCompleted: false } }),
    ]);

    return { completed, incomplete };
  }

  async findByCategory(categoryId: number, userId: number) {
    return await this.prisma.todo.findMany({
      where: { categoryId, userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
