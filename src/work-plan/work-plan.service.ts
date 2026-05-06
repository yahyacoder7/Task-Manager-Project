import { Injectable } from '@nestjs/common';
import { CreateWorkPlanDto } from './dto/create-work-plan.dto';
import { UpdateWorkPlanDto } from './dto/update-work-plan.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class WorkPlanService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createWorkPlanDto: CreateWorkPlanDto,userId:number) {
  try {
    const { todoIds, ...restDto } = createWorkPlanDto;
    
    const workplan = await this.prisma.workplan.create({
      data: { 
        ...restDto, 
        user: { connect: { userId:userId } },
        
        ...(todoIds && todoIds.length > 0 && {
          todo: {
            connect: todoIds.map(id => ({ todoId: id }))
          }
        })
      },
    });
    return workplan;
  } catch (error) {
    throw new BadRequestException(error.message);
  }
  }

  findAll() {
    return `This action returns all workPlan`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workPlan`;
  }

  update(id: number, updateWorkPlanDto: UpdateWorkPlanDto) {
    return `This action updates a #${id} workPlan`;
  }

  remove(id: number) {
    return `This action removes a #${id} workPlan`;
  }
}
