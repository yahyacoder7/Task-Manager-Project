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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // المسار العام لإنشاء المستخدم (يستخدمه نظام الـ Auth داخلياً)
  @Post()
  @ApiOperation({ summary: 'Internal: Create a new user account' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // الحصول على بيانات المستخدم الحالي (آمن عبر التوكن)
  @UseGuards(AuthGuard)
  @Get('profile/me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async findMe(@Req() req: any) {
    return this.usersService.findOne(+req.user.sub);
  }

  // تحديث بيانات المستخدم الحالي (آمن عبر التوكن)
  @UseGuards(AuthGuard)
  @Patch('profile/update')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = +req.user.sub;
    return this.usersService.update(userId, updateUserDto);
  }

  // حذف حساب المستخدم الحالي (آمن عبر التوكن)
  @UseGuards(AuthGuard)
  @Delete('profile/delete')
  @ApiOperation({ summary: 'Delete current user account' })
  async removeMe(@Req() req: any) {
    const userId = +req.user.sub;
    return this.usersService.remove(userId);
  }

  // مسار للأدمن مستقبلاً لرؤية الجميع
  @UseGuards(AuthGuard)
  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: List all users (Requires Guard update for real roles)' })
  findAll() {
    return this.usersService.findAll();
  }
}
