import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/service/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role, User, TokenType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}
  async validateUser(dto: LoginDto): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(dto.email);
    
    // Security best practice: Use generic message for both missing user and wrong password
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = {
      username: user.email,
      sub: user.userId,
      name: user.name,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);
    
    await this.prisma.verificationToken.upsert({
      where: {
        userId_type: {
          userId: user.userId,
          type: TokenType.EMAIL_VERIFICATION,
        }
      },
      update: {
        token: access_token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      create: {
        userId: user.userId,
        token: access_token,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      }
    });

    return { access_token, user };
  }

  async signUp(signUpDto: CreateUserDto) {
    const user = await this.usersService.findByEmail(signUpDto.email);
    if (user) {
      throw new BadRequestException('Email already registered');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await this.mailService.sendOTP(signUpDto.email, otp);
      await this.redisService.set(
        `register:${signUpDto.email}`,
        JSON.stringify({ ...signUpDto, otp }),
        'EX',
        60 * 5,
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to send verification code');
    }
  }

  async verifyOtp(email: string, otp: string | number) {
    if (typeof otp === 'number') {
      otp = otp.toString();
    }

    const data = await this.redisService.get(`register:${email}`);
    if (!data) {
      throw new UnauthorizedException('Code expired or invalid');
    }

    const userData = JSON.parse(data);
    if (userData.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const newUser = await this.usersService.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      isVerified: true,
      role: Role.USER,
    });

    await this.redisService.del(`register:${email}`);

    return {
      message: 'User registered successfully',
      user: newUser,
    };
  }
}
