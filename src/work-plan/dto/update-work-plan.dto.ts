import { PartialType } from '@nestjs/swagger';
import { CreateWorkPlanDto } from './create-work-plan.dto';

export class UpdateWorkPlanDto extends PartialType(CreateWorkPlanDto) {}
