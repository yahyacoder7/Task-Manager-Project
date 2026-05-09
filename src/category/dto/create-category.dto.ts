import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ description: 'The unique name of the category', example: 'Work' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
