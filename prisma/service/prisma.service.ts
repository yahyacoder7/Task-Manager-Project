import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Initialize the PrismaClient with the custom adapter
    super({ adapter }); // Pass the adapter to the PrismaClient constructor
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Prisma connected 🚀');
    } catch (error) {
      console.error('Error connecting to the database:', error);
      process.exit(1); // Exit the application if the database connection fails
    }
  }
}
