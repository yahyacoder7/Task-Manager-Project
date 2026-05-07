import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  IsPositive,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkPlanDto {
  @ApiProperty({ description: 'Name of the work plan', example: 'Summer Launch' })
  @IsString({ message: 'الاسم يجب أن يكون نصاً' })
  @MinLength(3, { message: 'الاسم يجب أن يتكون من 3 أحرف على الأقل' })
  name: string;

  @ApiPropertyOptional({ description: 'Optional description of the plan', example: 'All tasks related to the summer product launch' })
  @IsOptional()
  @IsString({ message: 'الوصف يجب أن يكون نصاً' })
  description?: string;

  @ApiPropertyOptional({ description: 'Array of todo IDs to associate with this plan', example: [1, 2, 3] })
  @IsOptional()
  @IsArray({ message: 'معرفات المهام يجب أن تكون مصفوفة' })
  @IsInt({ each: true, message: 'كل معرف مهمة يجب أن يكون رقماً صحيحاً' })
  @IsPositive({ each: true, message: 'كل معرف مهمة يجب أن يكون رقماً موجباً' })
  todoIds?: number[];
}
