import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class TodoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(createTodoDto: CreateTodoDto, userId: number) {
    // حماية: منع إنشاء مهمة في الماضي
    if (createTodoDto.startDate) {
      const newStartDate = new Date(createTodoDto.startDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDay = new Date(newStartDate.getFullYear(), newStartDate.getMonth(), newStartDate.getDate());
      
      if (startDay < today) {
        throw new BadRequestException('Cannot schedule a task in the past');
      }
    }

    const todo = await this.prisma.todo
      .create({
        data: { ...createTodoDto, userId },
      })
      .catch((err) => {
        throw new BadRequestException(
          'Failed to create task. Please check your data.',
        );
      });
    const aiAdvice = await this.aiService
      .getTaskAdvice(+todo.todoId, userId)
      .catch((err) => {
       console.error("Error getting AI advice", err);
      });

    return todo;
  }

  async findAll(userId: number) {
    return await this.prisma.todo.findMany({
      where: { userId },
      include: { 
        category: true,
        taskcompletions: { orderBy: { completedAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(todoId: number, userId: number) {
    const todo = await this.prisma.todo.findUnique({
      where: { todoId: todoId, userId: userId },
      include: { 
        category: true, 
        taskcompletions: true,
        workplan: true,
       },
    });
    if (!todo) {
      throw new NotFoundException('Task not found');
    }
    return todo;
  }

  async update(todoId: number, updateTodoDto: UpdateTodoDto, userId: number) {
    const todo = await this.findOne(todoId, userId);

    // حماية: منع إدخال تاريخ في الماضي
    if (updateTodoDto.startDate) {
      const newStartDate = new Date(updateTodoDto.startDate);
      const now = new Date();
      
      // نتحقق من اليوم (بدون الدقائق والثواني لكي نسمح بمهام اليوم الحالي)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDay = new Date(newStartDate.getFullYear(), newStartDate.getMonth(), newStartDate.getDate());
      
      if (startDay < today) {
        throw new BadRequestException('Cannot schedule a task in the past');
      }
    }

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
          // إذا قام بتغيير الوقت (تأجيل)، نفتح المهمة من جديد. غير ذلك، نتركها كما هي.
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
    const todo = await this.prisma.todo.findUnique({
      where: { todoId: todoId, userId: userId },
      include: { taskcompletions: { orderBy: { completedAt: 'desc' } } },
    });

    if (!todo) {
      throw new NotFoundException('Task not found');
    }

    if (todo.isCompleted) {
      throw new BadRequestException('Task is already completed');
    }

    // للمهام المتكررة
    if (todo.repeatUnit && todo.repeatInterval && todo.repeatInterval > 0) {
      // التحقق مما إذا كانت المهمة قد اكتملت بالفعل اليوم
      const lastCompletion = todo.taskcompletions[0];
      if (lastCompletion) {
        const now = new Date();
        const lastCompletedAt = new Date(lastCompletion.completedAt);
        if (
          lastCompletedAt.getUTCDate() === now.getUTCDate() &&
          lastCompletedAt.getUTCMonth() === now.getUTCMonth() &&
          lastCompletedAt.getUTCFullYear() === now.getUTCFullYear()
        ) {
          throw new BadRequestException('Repeating task is already completed for today');
        }
      }

      let nextDate: Date | null = null;
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
              nextDate.setFullYear(nextDate.getFullYear() + todo.repeatInterval);
              break;
          }
        }
      }

      return await this.prisma.todo.update({
        where: { todoId: todoId, userId: userId },
        data: {
          startDate: todo.startDate ? nextDate : null,
          isCompleted: false, // تبقى غير مكتملة لأنها متكررة
          notified: todo.expectedTime ? true : false,
          taskcompletions: {
            create: { completedAt: new Date() },
          },
        },
      });
    } else {
      // المهام العادية (التي لا تتكرر)
      return await this.prisma.todo.update({
        where: { todoId: todoId, userId: userId },
        data: {
          isCompleted: true, // تكتمل نهائياً
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

  async getTodoStats(userId: number) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const [completedNonRepeating, completedRepeatingToday, incomplete] = await Promise.all([
      this.prisma.todo.count({
        where: { userId, isCompleted: true },
      }),
      this.prisma.todo.count({
        where: {
          userId,
          repeatUnit: { not: null },
          taskcompletions: {
            some: {
              completedAt: { gte: todayStart, lte: todayEnd },
            },
          },
        },
      }),
      this.prisma.todo.count({
        where: {
          userId,
          OR: [
            { isCompleted: false, repeatUnit: null },
            {
              repeatUnit: { not: null },
              taskcompletions: {
                none: {
                  completedAt: { gte: todayStart, lte: todayEnd },
                },
              },
            },
          ],
        },
      }),
    ]);

    return { completed: completedNonRepeating + completedRepeatingToday, incomplete };
  }

  async findByCategory(categoryId: number, userId: number) {
    return await this.prisma.todo.findMany({
      where: { categoryId, userId },
      include: { 
        category: true,
        taskcompletions: { orderBy: { completedAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
