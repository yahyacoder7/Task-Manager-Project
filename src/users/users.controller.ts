import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.create(createUserDto);
      return {
        message: 'User created successfully',
        statusCode: 201,
      };
    } catch (error) {
      return {
        message: error,
        statusCode: 409,
      };
    }
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      await this.usersService.update(+id, updateUserDto);
      return {
        message: 'User updated successfully',
        statusCode: 200,
      };
    } catch (error) {
      return {
        message: error,
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.usersService.remove(+id);
      return {
        message: ' User deleted successfully',
        statusCode: 200,
      };
    } catch (error) {
      return {
        message: 'User not found',
        statusCode: 404,
      };
    }
  }
}
