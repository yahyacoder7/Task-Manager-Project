import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  constructor(private readonly configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL') || '';
    
    super(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: {},
    });

    // نضع المستمعين هنا في الـ constructor لنضمن التقاط الحدث فوراً
    this.on('connect', () => {
      this.logger.log('🟢 Redis Attempting Connection... 🟢');
    });

    this.on('ready', () => {
      this.logger.log('✅ Redis is Ready and Connected! ✅');
    });

    this.on('error', (error) => {
      this.logger.error('🔴 Redis Error: ' + error.message);
    });
  }

  onModuleInit() {
    // تم نقل المنطق للـ constructor
  }
  onModuleDestroy() {
    this.disconnect();
    this.logger.log(' ⚠️ Redis disconnected ⚠️');
  }
}
