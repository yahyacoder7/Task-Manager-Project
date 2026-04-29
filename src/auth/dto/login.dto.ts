import { IsEmail , IsNotEmpty, MinLength, IsString } from "class-validator";

export class LoginDto {
    @IsNotEmpty({message:"Email is required"})
    @IsEmail({} , {message:"Invalid email address"})
    email: string;
    
    @IsNotEmpty({message:"Password is required"})
    @MinLength(8 , {message:"Password must be at least 8 characters long"})
    password: string;
}