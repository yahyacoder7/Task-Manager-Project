import { Test, TestingModule } from '@nestjs/testing';
import { WorkPlanController } from './work-plan.controller';
import { WorkPlanService } from './work-plan.service';

describe('WorkPlanController', () => {
  let controller: WorkPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkPlanController],
      providers: [WorkPlanService],
    }).compile();

    controller = module.get<WorkPlanController>(WorkPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
