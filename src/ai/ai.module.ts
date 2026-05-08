import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../../prisma/module/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],     // For caching
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
