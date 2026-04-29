import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/service/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role, User,TokenType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async validateUser(
   dto:LoginDto,
  ): Promise<Omit<User, 'password'> | null> {
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
    const access_token = this.jwtService.sign(payload)
    await this.prisma.verificationToken.create({
      data:{
        userId: user.userId,
        token: access_token,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
      }
    })
    return {
      access_token,
      user
    };
  }
}
