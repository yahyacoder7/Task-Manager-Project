import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../../prisma/module/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RedisModule, PrismaModule, AuthModule], // For caching
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
