import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateWorkPlanDto } from './dto/create-work-plan.dto';
import { UpdateWorkPlanDto } from './dto/update-work-plan.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
import { Prisma } from '@prisma/client';

type workplanType = Prisma.WorkplanGetPayload<{
  select: typeof workplanSelect;
}>;

const todayStart = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
const todayEnd = () => {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const workplanSelect = {
  workplanId: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { todo: true } },
} satisfies Prisma.WorkplanSelect;

const isTodoCompleted = (t: any) => {
  if (t.isCompleted) return true;
  if (t.repeatUnit && t.taskcompletions && t.taskcompletions.length > 0) return true;
  return false;
};

const calculateProgress = (workplan: any) => {
  const totalTodos = workplan._count?.todo || 0;

  const completedTodos = workplan.todo
    ? workplan.todo.filter((t: any) => isTodoCompleted(t)).length
    : 0;

  const percOfCompletedTodos =
    totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  return {
    ...workplan,
    progressState: {
      totalTodos,
      completedTodos,
      percOfCompletedTodos: Math.round(percOfCompletedTodos),
    },
  };
};

@Injectable()
export class WorkPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWorkPlanDto: CreateWorkPlanDto, userId: number) {
    const { todoIds, ...restDto } = createWorkPlanDto;

    // Security: Verify that all provided todoIds belong to the authenticated user
    if (todoIds && todoIds.length > 0) {
      const ownedTodos = await this.prisma.todo.findMany({
        where: { todoId: { in: todoIds }, userId: userId },
      });

      if (ownedTodos.length !== todoIds.length) {
        throw new BadRequestException(
          'One or more Todo IDs are invalid or unauthorized',
        );
      }
    }

    // Use transaction to ensure data consistency
    return await this.prisma.$transaction(async (tx) => {
      const workplan = await tx.workplan.create({
        data: {
          ...restDto,
          user: { connect: { userId: userId } },
          ...(todoIds &&
            todoIds.length > 0 && {
              todo: {
                connect: todoIds.map((id) => ({ todoId: id })),
              },
            }),
        },
      });

      // Update orders based on the array sequence
      if (todoIds && todoIds.length > 0) {
        for (let i = 0; i < todoIds.length; i++) {
          await tx.todo.update({
            where: { todoId: todoIds[i] },
            data: { order: i },
          });
        }
      }

      return workplan;
    });
  }

  async findAll(userId: number) {
    return await this.prisma.workplan.findMany({
      where: { userId: userId },
      include: {
        todo: {
          orderBy: { order: 'asc' }, // Ensure list is ordered
        },
      },
    });
  }

  async findOne(workPlanId: number, userId: number) {
    const workplan = await this.prisma.workplan.findUnique({
      where: { workplanId: workPlanId, userId: userId },
      include: {
        todo: {
          orderBy: { order: 'asc' }, // Ensure details are ordered
        },
      },
    });

    if (!workplan) {
      throw new NotFoundException('Work plan not found');
    }

    return workplan;
  }

  async update(
    workPlanId: number,
    updateWorkPlanDto: UpdateWorkPlanDto,
    userId: number,
  ) {
    await this.findOne(workPlanId, userId);
    const { todoIds, ...restDto } = updateWorkPlanDto;

    if (todoIds && todoIds.length > 0) {
      const ownedTodos = await this.prisma.todo.findMany({
        where: { todoId: { in: todoIds }, userId: userId },
      });

      if (ownedTodos.length !== todoIds.length) {
        throw new BadRequestException(
          'One or more Todo IDs are invalid or unauthorized',
        );
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedWorkplan = await tx.workplan.update({
        where: { workplanId: workPlanId },
        data: {
          ...restDto,
          ...(todoIds && {
            todo: {
              set: todoIds.map((id) => ({ todoId: id })),
            },
          }),
        },
      });

      // Update orders to match the new sequence
      if (todoIds && todoIds.length > 0) {
        for (let i = 0; i < todoIds.length; i++) {
          await tx.todo.update({
            where: { todoId: todoIds[i] },
            data: { order: i },
          });
        }
      }

      return updatedWorkplan;
    });
  }

  /**
   * Reorders tasks within a work plan manually (useful for Drag & Drop)
   */
  async reorderTodos(workPlanId: number, todoIds: number[], userId: number) {
    // Verify ownership of the plan
    await this.findOne(workPlanId, userId);

    return await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < todoIds.length; i++) {
        await tx.todo.update({
          where: { todoId: todoIds[i], workplanId: workPlanId },
          data: { order: i },
        });
      }
      return { message: 'Reordered successfully' };
    });
  }

  async remove(workPlanId: number, userId: number) {
    await this.findOne(workPlanId, userId);
    return await this.prisma.workplan.delete({
      where: { workplanId: workPlanId },
    });
  }

  /**
   * Disconnects a specific todo from its work plan (making it free)
   */
  async removeTodoFromWorkPlan(todoId: number, userId: number) {
    return await this.prisma.todo
      .update({
        where: { todoId: todoId, userId: userId },
        data: {
          workplan: { disconnect: true },
        },
      })
      .catch(() => {
        throw new BadRequestException('Failed to remove task from work plan');
      });
  }

  /**
   * Fetches full details of a single work plan, including all its todos,
   * and calculates the completion progress.
   */
  async getWorkPlanDetailsWithProgress(userId: number, workplanId: number) {
    const workplan = await this.prisma.workplan.findUnique({
      where: { userId: userId, workplanId: workplanId },
      select: {
        ...workplanSelect,
        todo: {
          orderBy: { order: 'asc' },
          select: {
            todoId: true,
            title: true,
            description: true,
            startDate: true,
            isCompleted: true,
            repeatUnit: true,
            category: true,
            taskcompletions: {
              where: { completedAt: { gte: todayStart(), lte: todayEnd() } },
              select: { completionId: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!workplan) {
      throw new NotFoundException(`Work plan with ID ${workplanId} not found`);
    }

    return calculateProgress(workplan);
  }

  /**
   * Fetches a summarized list of all work plans for a user,
   * optimized with only completed todos for progress calculation.
   */
  async getUserWorkPlansListWithProgress(userId: number) {
    const workplans = await this.prisma.workplan.findMany({
      where: { userId: userId },
      select: {
        ...workplanSelect,
        todo: {
          orderBy: { order: 'asc' },
          select: {
            isCompleted: true,
            repeatUnit: true,
            taskcompletions: {
              where: { completedAt: { gte: todayStart(), lte: todayEnd() } },
              select: { completionId: true },
              take: 1,
            },
          },
        },
      },
    });

    return workplans.map((workplan) => calculateProgress(workplan));
  }
}
