import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/module/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
