import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/service/prisma.service';
import { ExpectedTime } from '@prisma/client';
@Injectable()
export class TodoSchedule {
  private readonly logger = new Logger(TodoSchedule.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handle() {
    this.logger.log('Checking Todos that are due ');

    const now = new Date();
    now.setSeconds(0, 0);
    const currentHour = now.getHours();

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
      dueTodos.forEach((todo) => {
        this.logger.log(
          `Sending reminder for todo: ${todo.title} to user ${todo.userId}`,
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
    const periodToHour = {
      MORNING: 5,
      AFTERNOON: 12,
      EVENING: 17,
      NIGHT: 22,
    };

    //this give us the current period based on the current hour
    const currentPeriod = Object.entries(periodToHour).find(
      ([period, hour]) => hour == currentHour,
    )?.[0] as ExpectedTime | undefined;

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

      dueTodos.forEach((todo) => {
        this.logger.log(
          `Sending reminder for todo: ${todo.title} to user ${todo.userId}`,
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
        notified: true,
      },
      data: {
        notified: false,
      },
    });
  }
}
