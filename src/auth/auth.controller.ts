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

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP code to user email' })
  @ApiResponse({ status: 200, description: 'New OTP sent successfully.' })
  @ApiResponse({ status: 400, description: 'Registration data not found or expired.' })
  async resendOtp(@Body('email') email: string) {
    return await this.authService.resendOtp(email);
  }
}
