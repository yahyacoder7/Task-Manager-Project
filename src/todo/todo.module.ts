import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/module/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService],
})
export class TodoModule {}
