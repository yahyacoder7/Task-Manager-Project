import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsInt, ValidateIf, IsEmpty, IsPositive , IsDefined, IsDate , IsDateString} from 'class-validator';
import { ExpectedTime, RepeatUnit } from '@prisma/client';
import { Type } from 'class-transformer';
export class CreateTodoDto {
    @IsString()
    @IsNotEmpty()
    title:string

    @IsString()
    @IsOptional()
    description?:string

    @IsEnum(ExpectedTime)
    @IsOptional()
    @ValidateIf(o=> o.startDate)
    @IsEmpty()
    expectedTime?:ExpectedTime

    @IsDateString()
    @IsOptional()
    @ValidateIf(o=> o.expectedTime)
    @IsEmpty()
    startDate?:Date

    @IsEnum(RepeatUnit)
    @IsOptional()
    @ValidateIf(o => !o.startDate && !o.expectedTime)
     @IsEmpty({message:"startDate or expectedTime must be provided"})
    repeatUnit?:RepeatUnit

    @IsNumber()
    @IsOptional()
    @ValidateIf(o => o.repeatUnit)
    @IsDefined({message:"repeatInterval must be provided"})
    @IsPositive()
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
