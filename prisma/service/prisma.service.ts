import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('PrismaService');
  constructor(private readonly configService: ConfigService) {
    // Initialize the connection pool for PostgreSQL
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    //to use postgresql database i need to use prisma adapter for postgresql
    const adapter = new PrismaPg(pool);
    // Initialize the PrismaClient with the custom adapter
    super({ adapter }); // Pass the adapter to the PrismaClient constructor
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Prisma connected 🚀');
    } catch (error) {
      this.logger.error('Error connecting to the database:', error);
      process.exit(1); // Exit the application if the database connection fails
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected ⚠️');
  }
}
