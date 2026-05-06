import { IsString, IsArray, IsOptional, IsNumber , IsInt, IsPositive} from "class-validator";

export class CreateWorkPlanDto{
    @IsString()
    name: string;
    
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    todoIds?: number[];
}
