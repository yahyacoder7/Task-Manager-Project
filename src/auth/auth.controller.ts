import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and send OTP' })
  @ApiResponse({ status: 201, description: 'User data stored, OTP sent to email.' })
  @ApiResponse({ status: 400, description: 'Email already registered.' })
  async signUp(@Body() signUpDto: CreateUserDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code to complete registration' })
  @ApiResponse({ status: 200, description: 'OTP verified, user account created.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return await this.authService.verifyOtp(email, otp);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in, returns JWT token.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    return await this.authService.login(user!);
  }
}
