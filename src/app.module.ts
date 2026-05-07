import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from '../prisma/module/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TodoModule } from './todo/todo.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CategoryModule } from './category/category.module';
import { WorkPlanModule } from './work-plan/work-plan.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TodoModule,
    CategoryModule,
    WorkPlanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
