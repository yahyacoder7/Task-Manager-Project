import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async signUp(@Body() signUpDto: CreateUserDto) {
    return await this.authService.signUp(signUpDto);
  }
  @Post('verify-otp')
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return await this.authService.verifyOtp(email, otp);
  }
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    return await this.authService.login(user!);
  }
}
