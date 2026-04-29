import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  constructor(private readonly configService: ConfigService) {
    super({
      host: configService.get<string>('REDIS_HOST'),
      port: Number(configService.get<number>('REDIS_PORT')),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
     lazyConnect: true,
    });
  }
  onModuleInit() {
    try {
      this.connect();
      this.logger.log('🟢 Redis connected 🟢');
    } catch (error) {
      this.logger.error(error + '🔴 Redis not connected 🔴');
    }
  }
  onModuleDestroy() {
    this.disconnect();
    this.logger.log(' ⚠️ Redis disconnected ⚠️');
  }
}
