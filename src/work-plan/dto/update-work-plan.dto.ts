import { CreateWorkPlanDto } from './create-work-plan.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateWorkPlanDto extends PartialType(CreateWorkPlanDto) {}
