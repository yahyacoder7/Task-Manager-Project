import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../../prisma/service/prisma.service';
import { Groq } from 'groq-sdk';

@Injectable()
export class AiService {
  private groq: Groq;
  constructor(
    private config: ConfigService,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {
   this.groq = new Groq({ apiKey: this.config.get<string>('GROQ_API_KEY') });
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

    const cacheKey = `user:${userId}:task:${todoId}:advice`;
    const cachedAdvice = await this.redis.get(cacheKey);
    if (cachedAdvice) {
      return {
        advice: cachedAdvice,
        source: 'cache',
      };
    }

    try {
  // 2. طلب النصيحة من Groq
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
         content: `أعطني نصيحة عملية بحدود 30 كلمة لهذه المهمة: ${taskOwnership.title} وصفها: ${taskOwnership.description || 'لاوصف'}`
          },
        ],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 80,
      });

      const advice = chatCompletion.choices[0]?.message?.content || "بالتوفيق في مهمتك!";

      // 3. تصحيح: حفظ النصيحة في Redis لمدة 24 ساعة
      await this.redis.set(cacheKey, advice, 'EX', 86400);

      return { advice, source: 'ai' };
    } catch (error) {
      console.error('Error generating AI advice:', error);
      throw new InternalServerErrorException(
        'فشل إنشاء النصيحة من الذكاء الاصطناعي: ' + error.message,
      );
    }
  }
}
