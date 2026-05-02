import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsInt } from 'class-validator';
import { ExpectedTime, RepeatUnit } from '@prisma/client';
export class CreateTodoDto {
    @IsString()
    @IsNotEmpty()
    title:string

    @IsString()
    @IsOptional()
    description?:string

    @IsEnum(ExpectedTime)
    @IsOptional()
    expectedTime?:ExpectedTime

    @IsEnum(RepeatUnit)
    @IsOptional()
    repeatUnit?:RepeatUnit

    @IsNumber()
    @IsOptional()
    repeatInterval?:number

    @IsNumber()
    @IsOptional()
    categoryId?:number;

    @IsNumber()
    @IsOptional()
    workplanId?:number;

    @IsInt()
    @IsOptional()
    order?:number;

}
