import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password (min 8 characters)', example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
