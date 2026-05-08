import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../../prisma/service/prisma.service';
@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  constructor(
    private config: ConfigService,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {
    this.genAI = new GoogleGenerativeAI(
      this.config.get<string>('GOOGLE_API_KEY')!,
    );
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async getTaskAdvice(
    todoId: number,
    userId: number,
  ) {
    const taskOwnership = await this.prisma.todo.findFirst({
      where: {
        todoId: todoId,
        userId: userId,
      },
    });

    if (!taskOwnership) {
      throw new Error('You are not the owner of this task');
    }
    const title = taskOwnership.title;
    const description = taskOwnership.description;

    const cacheKey = `task-advice:${todoId}`;
    const cachedAdvice = await this.redis.get(cacheKey);
    if (cachedAdvice) {
      return {
        advice: cachedAdvice,
        source: 'cache',
      };
    }

    const prompt = `أنت مساعد لإدارة المهام. أعطِ نصيحة عملية لإنجاز هذه المهمة في جملة واحدة لا تتجاوز 30 كلمة بدون مقدمات:
عنوان المهمة: "${title}"
وصف المهمة: "${description || 'لا يوجد وصف'}"`;

    try {
      const result = await this.model.generateContent(prompt);
      const advice = result.response.text();

      await this.redis.set(cacheKey, advice, 'EX', 86400);
      return {
        advice,
        source: 'api',
      };
    } catch (error) {
      console.error('Error generating AI advice:', error);
      return {
        advice: 'لا يوجد نصيحة حاليا',
        source: 'error',
      };
    }
  }
}
