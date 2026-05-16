import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/service/prisma.service';
import { ExpectedTime } from '@prisma/client';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TodoSchedule {
  private readonly logger = new Logger(TodoSchedule.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handle() {
    this.logger.log('Checking Todos that are due ');

    const now = new Date();
    now.setSeconds(0, 0);
    const currentHour = now.getHours();

    // Reset isCompleted for repeated tasks whose next occurrence has arrived
    await this.prisma.todo.updateMany({
      where: {
        repeatUnit: { not: null },
        isCompleted: true,
        startDate: { lte: now },
      },
      data: {
        isCompleted: false,
        notified: false,
      },
    });

    await this.handleByStartDate(now);
    await this.handleByExpectedTime(currentHour);

    /* in the future we will use websocket to send notification to the user */
  }
  private async handleByStartDate(now: Date) {
    const dueTodos = await this.prisma.todo.findMany({
      where: {
        startDate: {
          lte: new Date(now.getTime() + 1 * 60 * 1000),
        },
        isCompleted: false,
        notified: false,
      },
    });

    if (dueTodos.length > 0) {
      const todoIds = dueTodos.map((todo) => todo.todoId);
      dueTodos.forEach(async (todo) => {
        const notification = {
          title: 'Task Reminder',
          message: `It is time to perform your task: ${todo.title}`,
          todoId: todo.todoId,
          createdAt: new Date(),
        };

        const redisKey = `notifications:${todo.userId}`;
        await this.redis.rpush(redisKey, JSON.stringify(notification));
        await this.redis.expire(redisKey, 86400); // تختفي بعد 24 ساعة

        this.logger.log(
          `Stored notification in Redis for todo: ${todo.title} to user ${todo.userId}`,
        );
      });

      await this.prisma.todo.updateMany({
        where: { todoId: { in: todoIds } },
        data: {
          notified: true,
        },
      });
    }
  }
  private async handleByExpectedTime(currentHour: number) {
    const now = new Date();
    // Determine the current period based on the hour range
    let currentPeriod: ExpectedTime | undefined;
    if (currentHour >= 5 && currentHour < 12) currentPeriod = 'MORNING';
    else if (currentHour >= 12 && currentHour < 17) currentPeriod = 'AFTERNOON';
    else if (currentHour >= 17 && currentHour < 22) currentPeriod = 'EVENING';
    else if (currentHour >= 22 || currentHour < 5) currentPeriod = 'NIGHT';

    // return if the current period is not found
    if (!currentPeriod) return;

    // find all todos that are due in the current period
    const dueTodos = await this.prisma.todo.findMany({
      where: {
        expectedTime: currentPeriod,
        isCompleted: false,
        notified: false,
      },
    });

    if (dueTodos.length > 0) {
      const todoIds = dueTodos.map((todo) => todo.todoId);

      dueTodos.forEach(async (todo) => {
        const notification = {
          title: 'Period Task Reminder',
          message: `Time to perform the task for this period: ${todo.title}`,
          todoId: todo.todoId,
          createdAt: new Date(),
        };

        const redisKey = `notifications:${todo.userId}`;
        await this.redis.rpush(redisKey, JSON.stringify(notification));
        await this.redis.expire(redisKey, 86400); // 24 hours

        this.logger.log(
          `Stored period notification in Redis for todo: ${todo.title} to user ${todo.userId}`,
        );
      });

      await this.prisma.todo.updateMany({
        where: { todoId: { in: todoIds } },
        data: {
          notified: true,
        },
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetNotidied() {
    this.logger.log('Resetting notified status for all todos');
    // this operation update the notified status to false for all repeated todos
    await this.prisma.todo.updateMany({
      where: {
        repeatUnit: { not: null },
        OR: [{ notified: true }, { isCompleted: true }],
      },
      data: {
        notified: false,
        isCompleted: false,
      },
    });
  }
}
