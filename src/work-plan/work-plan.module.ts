import { Module } from '@nestjs/common';
import { WorkPlanService } from './work-plan.service';
import { WorkPlanController } from './work-plan.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/module/prisma.module';

@Module({
  imports: [AuthModule,PrismaModule],
  controllers: [WorkPlanController],
  providers: [WorkPlanService],
})
export class WorkPlanModule {}
