import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getNotifications(userId: number) {
    const redisKey = `notifications:${userId}`;
    // جلب كل الإشعارات من القائمة
    const notifications = await this.redis.lrange(redisKey, 0, -1);
    
    // مسح الإشعارات بعد جلبها (لأننا اعتبرناها وصلت للمستخدم)
    await this.redis.del(redisKey);

    return notifications.map(n => JSON.parse(n));
  }

  async create(createUserDto: CreateUserDto & {role?:Role , isVerified?:boolean  } ) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    createUserDto.password = hashedPassword;
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { userId: id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { userId: id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: { userId: id },
    });
  }
}
