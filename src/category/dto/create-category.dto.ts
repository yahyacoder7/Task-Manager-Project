import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name:string;
    @IsNumber()
    @IsOptional()
    userId?:number;
}
