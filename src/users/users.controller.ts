import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── USER PROFILE ROUTES (Authenticated Users) ───

  @UseGuards(AuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  getProfile(@Req() req: any) {
    return this.usersService.findOne(+req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('notifications')
  @ApiOperation({ summary: 'Get all pending notifications for the logged-in user' })
  async getNotifications(@Req() req: any) {
    return await this.usersService.getNotifications(+req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  @ApiOperation({ summary: 'Update current logged-in user profile' })
  async updateProfile(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(+req.user.sub, updateUserDto);
  }

  // ─── ADMIN ROUTES (Admins Only) ───

  @UseGuards(AdminGuard)
  @Get()
  @ApiOperation({ summary: '[ADMIN] Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  @ApiOperation({ summary: '[ADMIN] Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(AdminGuard)
  @Post('admin-create')
  @ApiOperation({ summary: '[ADMIN] Create a user directly' })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  @ApiOperation({ summary: '[ADMIN] Delete a user' })
  async remove(@Param('id') id: string, @Req() req: any) {
    // Prevent admin from deleting themselves accidentally
    if (+id === +req.user.sub) {
      throw new ForbiddenException('You cannot delete your own admin account');
    }
    try {
      await this.usersService.remove(+id);
      return { message: 'User deleted successfully', statusCode: 200 };
    } catch (error) {
      return { message: 'User not found', statusCode: 404 };
    }
  }
}

