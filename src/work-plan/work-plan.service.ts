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

const workplanSelect = {
  //work plan data
  workplanId: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  //work plan's todos state data
  _count: { select: { todo: true } },
} satisfies Prisma.WorkplanSelect;
const calculateProgress = (workplan: any) => {
  const totalTodos = workplan._count?.todo || 0;

  // This filter works for both cases:
  // 1. If DB already filtered (isCompleted: true), the JS filter won't change anything.
  // 2. If DB sent everything, the JS filter will correctly count only completed ones.
  const completedTodos = workplan.todo
    ? workplan.todo.filter((t: any) => t.isCompleted === true).length
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
        // Fetch all todos with full details for the single view
        todo: {
          orderBy: { order: 'asc' },
          select: {
            todoId: true,
            title: true,
            description: true,
            startDate: true,
            isCompleted: true,
            category: true,
          },
        },
      },
    });

    if (!workplan) {
      throw new NotFoundException(`Work plan with ID ${workplanId} not found`);
    }

    // Process workplan to add progress state and return
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
        // Only fetch minimal todo data (completed only) to save performance in list view
        todo: {
          where: { isCompleted: true },
          select: { isCompleted: true },
        },
      },
    });

    // Map through each workplan and calculate its progress state
    return workplans.map((workplan) => calculateProgress(workplan));
  }
}
