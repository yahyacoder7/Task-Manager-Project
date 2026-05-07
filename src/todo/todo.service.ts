import { Injectable, NotFoundException , BadRequestException} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from '../../prisma/service/prisma.service';


@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTodoDto: CreateTodoDto, userId: number) {
    return await this.prisma.todo
      .create({
        data: { ...createTodoDto, userId },
      })
      .catch((err) => {
        throw new BadRequestException('Failed to create task. Please check your data.');
      });
  }

  async findAll(userId: number) {
    return await this.prisma.todo.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(todoId: number, userId: number) {
    const todo = await this.prisma.todo.findUnique({
      where: { todoId: todoId, userId: userId },
      include: { category: true },
    });
    if (!todo) {
      throw new NotFoundException('Task not found');
    }
    return todo;
  }

  async update(todoId: number, updateTodoDto: UpdateTodoDto, userId: number) {
    const todo = await this.findOne(todoId, userId);

    const isTimeChanged =
      (updateTodoDto.startDate !== undefined &&
        new Date(updateTodoDto.startDate).getTime() !==
          todo.startDate?.getTime()) ||
      (updateTodoDto.expectedTime !== undefined &&
        updateTodoDto.expectedTime !== todo.expectedTime);

    return await this.prisma.todo
      .update({
        where: { todoId: todoId, userId: userId },
        data: {
          ...updateTodoDto,
          notified: isTimeChanged ? false : todo.notified,
          isCompleted: isTimeChanged ? false : todo.isCompleted,
        },
      })
      .catch(() => {
        throw new BadRequestException('Failed to update task');
      });
  }

  async remove(todoId: number, userId: number) {
    await this.findOne(todoId, userId);
    return await this.prisma.todo.delete({
      where: { todoId: todoId, userId: userId },
    });
  }

  async completeTodo(todoId: number, userId: number) {
    const todo = await this.findOne(todoId, userId);

    if (todo.isCompleted) {
      throw new BadRequestException('Task is already completed');
    }

    let nextDate: Date | null = null;

    if (todo.repeatUnit && todo.repeatInterval && todo.repeatInterval > 0) {
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

      return await this.prisma.todo.update({
        where: { todoId: todoId, userId: userId },
        data: {
          startDate: todo.startDate ? nextDate : null,
          isCompleted: true,
          notified: todo.expectedTime ? true : false,
          taskcompletions: {
            create: { completedAt: new Date() },
          },
        },
      });
    } else {
      return await this.prisma.todo.update({
        where: { todoId: todoId, userId: userId },
        data: {
          isCompleted: true,
          taskcompletions: {
            create: { completedAt: new Date() },
          },
        },
      });
    }
  }

  async getAllCompeletedTodos(userId: number, period: string) {
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
        throw new BadRequestException('Invalid time period');
    }

    return await this.prisma.todo.findMany({
      where: {
        userId,
        taskcompletions: {
          some: {
            completedAt: { gte: now },
          },
        },
      },
      include: {
        category: true,
        taskcompletions: true,
        workplan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvailableTodos(userId: number) {
    return await this.prisma.todo.findMany({
      where: {
        userId: userId,
        workplanId: null,
      },
      include: { category: true },
    });
  }
}
