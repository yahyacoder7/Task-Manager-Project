import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    @IsNotEmpty({ message: "Email is required" })
    @IsEmail({}, { message: "Invalid email address" })
    email: string;

    @ApiProperty({ description: 'User password (min 8 characters)', example: 'password123' })
    @IsNotEmpty({ message: "Password is required" })
    @MinLength(8, { message: "Password must be at least 8 characters long" })
    password: string;
}