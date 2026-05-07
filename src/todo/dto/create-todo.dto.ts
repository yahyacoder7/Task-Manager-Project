import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsInt, ValidateIf, IsEmpty, IsPositive, IsDefined, IsDateString } from 'class-validator';
import { ExpectedTime, RepeatUnit } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTodoDto {
    @ApiProperty({ description: 'The title of the task', example: 'Buy groceries' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Detailed description of the task', example: 'Need to buy milk, bread, and eggs' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: ExpectedTime, description: 'General time period of the day' })
    @IsEnum(ExpectedTime)
    @IsOptional()
    @ValidateIf(o => o.startDate)
    @IsEmpty()
    expectedTime?: ExpectedTime;

    @ApiPropertyOptional({ description: 'Specific start date and time', example: '2026-05-07T10:00:00Z' })
    @IsDateString()
    @IsOptional()
    @ValidateIf(o => o.expectedTime)
    @IsEmpty()
    startDate?: Date;

    @ApiPropertyOptional({ enum: RepeatUnit, description: 'Recurrence frequency' })
    @IsEnum(RepeatUnit)
    @IsOptional()
    @ValidateIf(o => !o.startDate && !o.expectedTime)
    @IsEmpty({ message: "startDate or expectedTime must be provided" })
    repeatUnit?: RepeatUnit;

    @ApiPropertyOptional({ description: 'Interval for recurrence (e.g., every 2 days)', example: 1 })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    @ValidateIf(o => o.repeatUnit)
    @IsDefined({ message: "repeatInterval must be provided" })
    repeatInterval?: number;

    @ApiPropertyOptional({ description: 'ID of the associated category', example: 1 })
    @IsNumber()
    @IsOptional()
    categoryId?: number;

    @ApiPropertyOptional({ description: 'ID of the associated work plan', example: 1 })
    @IsNumber()
    @IsOptional()
    workplanId?: number;

    @ApiPropertyOptional({ description: 'Sort order of the task', example: 0 })
    @IsInt()
    @IsOptional()
    order?: number;
}
