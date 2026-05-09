<<<<<<< HEAD
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
=======
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
>>>>>>> 2067fa8fad0651c6a5831f3a6e115bf646cf90bf

export class UpdateUserDto {
  @ApiProperty({ description: 'User full name', example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;
}
