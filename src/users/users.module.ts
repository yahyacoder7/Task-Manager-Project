import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtService } from '@nestjs/jwt';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, JwtService, AdminGuard],
  exports: [UsersService],
})
export class UsersModule {}
