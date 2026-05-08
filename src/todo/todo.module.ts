import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/module/prisma.module';
import { TodoSchedule } from './todo.schedule';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AuthModule, PrismaModule, AiModule],
  controllers: [TodoController],
  providers: [TodoService, TodoSchedule],
  exports: [TodoService],
})
export class TodoModule {}
