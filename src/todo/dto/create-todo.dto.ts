import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExpectedTime, RepeatUnit } from  '@prisma/client';
export class CreateTodoDto {
    @IsString()
    @IsNotEmpty()
    title:string

    @IsString()
    @IsOptional()
    description?:string

    @IsDateString()
    @IsOptional()
    expectedTime?:Date

    @IsEnum(RepeatUnit)
    @IsOptional()
    repeatUnit?:RepeatUnit

    @IsNumber()
    @IsOptional()
    repeatInterval?:number

}
