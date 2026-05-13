import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/service/prisma.service';

const EXPECTED_TIME_AR: Record<string, string> = {
  MORNING: 'صباحاً',
  AFTERNOON: 'ظهراً',
  EVENING: 'مساءً',
  NIGHT: 'ليلاً',
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: number) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [totalTasks, completedToday, completedThisWeek, completedThisMonth, activeWorkplans, totalCategories, repeatingTasks] = await Promise.all([
      this.prisma.todo.count({ where: { userId } }),
      this.prisma.taskcompletion.count({
        where: {
          completedAt: { gte: todayStart, lte: todayEnd },
          todo: { userId },
        },
      }),
      this.prisma.taskcompletion.count({
        where: {
          completedAt: { gte: weekStart },
          todo: { userId },
        },
      }),
      this.prisma.taskcompletion.count({
        where: {
          completedAt: { gte: monthStart },
          todo: { userId },
        },
      }),
      this.prisma.workplan.count({ where: { userId, isActive: true } }),
      this.prisma.category.count({ where: { userId } }),
      this.prisma.todo.count({ where: { userId, repeatUnit: { not: null } } }),
    ]);

    return {
      totalTasks,
      completedToday,
      completedThisWeek,
      completedThisMonth,
      activeWorkplans,
      totalCategories,
      repeatingTasks,
    };
  }

  async getCompletionTrend(userId: number, days: number) {
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCHours(23, 59, 59, 999);
      dayStart.setUTCHours(0, 0, 0, 0);

      const count = await this.prisma.taskcompletion.count({
        where: {
          completedAt: { gte: dayStart, lte: dayEnd },
          todo: { userId },
        },
      });

      result.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }
    return result;
  }

  async getCategoryBreakdown(userId: number) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: { todos: { select: { todoId: true, isCompleted: true, repeatUnit: true } } },
    });

    return categories.map((cat) => {
      const total = cat.todos.length;
      const completed = cat.todos.filter(
        (t) => t.isCompleted || t.repeatUnit,
      ).length;
      const incomplete = total - completed;
      return {
        categoryName: cat.name,
        total,
        completed,
        incomplete,
      };
    });
  }

  async getTimeDistribution(userId: number) {
    const todos = await this.prisma.todo.findMany({
      where: { userId, expectedTime: { not: null } },
      select: { expectedTime: true },
    });

    const distribution: Record<string, number> = {};
    for (const t of todos) {
      const key = t.expectedTime!;
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return Object.entries(distribution).map(([period, count]) => ({
      period,
      label: EXPECTED_TIME_AR[period] || period,
      count,
    }));
  }

  async getWorkplanSummary(userId: number) {
    const workplans = await this.prisma.workplan.findMany({
      where: { userId, isActive: true },
      include: {
        _count: { select: { todo: true } },
        todo: {
          select: { isCompleted: true, repeatUnit: true, taskcompletions: { take: 1, orderBy: { completedAt: 'desc' } } },
        },
      },
    });

    return workplans.map((wp) => {
      const totalTodos = wp._count.todo;
      const completedTodos = wp.todo.filter((t) => {
        if (t.isCompleted) return true;
        if (t.repeatUnit && t.taskcompletions.length > 0) return true;
        return false;
      }).length;
      const percent = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
      return {
        name: wp.name,
        totalTodos,
        completedTodos,
        percent,
      };
    });
  }
}
