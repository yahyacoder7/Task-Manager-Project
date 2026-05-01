import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    //check if user exists
    if (!user) {
      throw new UnauthorizedException('User not found');
    } else {
      //check if password is matching user password
      const isMatch = await bcrypt.compare(dto.password, user.password);

      // if password is not match
      if (!isMatch) {
        throw new UnauthorizedException('Invalid password');
      }
      const { password: _, ...result } = user;
      return result;
    }
  }
  async login(user: Omit<User, 'password'>) {
    const payload = {
      username: user.email,
      sub: user.userId,
      name: user.name,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);
    await this.prisma.verificationToken.create({
      data: {
        userId: user.userId,
        token: access_token,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });
    return {
      access_token,
      user,
    };
  }
  async signUp(signUpDto: CreateUserDto) {
    const user = await this.usersService.findByEmail(signUpDto.email);
    if (user) {
      throw new UnauthorizedException(
        'The user with this email already exists',
      );
    }
    // generating 6 digits code for user verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // sending the code to user email

    await this.mailService.sendOTP(signUpDto.email, otp);

    // storing the code in redis and the otp is become in type of string
    try {
      const res = await this.redisService.set(
        `register:${signUpDto.email}`,
        JSON.stringify({ ...signUpDto, otp }),
        'EX',
        60 * 5,
      );
    } catch (error) {
      console.log(error);
    }
  }
  async verifyOtp(email: string, otp: string|number) {
    if(typeof otp === 'number'){
      otp = otp.toString();
    }
    const data = await this.redisService.get(`register:${email}`);

    if (!data) {
      throw new UnauthorizedException('Code is expired or invalid');
    }
    // this line is to parse the data from redis to get user info 
    const userData = JSON.parse(data);
//compare the code from user that is string with the code in redis that is string 
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
      message: 'User created successfully',
      data: newUser,
    };
  }
}
