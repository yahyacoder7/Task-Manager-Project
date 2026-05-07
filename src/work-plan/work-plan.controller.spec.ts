import { Test, TestingModule } from '@nestjs/testing';
import { WorkPlanController } from './work-plan.controller';
import { WorkPlanService } from './work-plan.service';
import { AuthGuard } from '../auth/guards/auth.guard';

describe('WorkPlanController', () => {
  let controller: WorkPlanController;
  let service: WorkPlanService;

  const mockWorkPlanService = {
    create: jest.fn(),
    getUserWorkPlansListWithProgress: jest.fn(),
    getWorkPlanDetailsWithProgress: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeTodoFromWorkPlan: jest.fn(),
  };

  const mockRequest = {
    user: { sub: '1' }, // Simulate authenticated user ID 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkPlanController],
      providers: [
        { provide: WorkPlanService, useValue: mockWorkPlanService },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true }) // Skip real guard logic
    .compile();

    controller = module.get<WorkPlanController>(WorkPlanController);
    service = module.get<WorkPlanService>(WorkPlanService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call getUserWorkPlansListWithProgress with correct userId', async () => {
      await controller.findAll(mockRequest);
      expect(service.getUserWorkPlansListWithProgress).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should call getWorkPlanDetailsWithProgress with correct parameters', async () => {
      const planId = '100';
      await controller.findOne(planId, mockRequest);
      expect(service.getWorkPlanDetailsWithProgress).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('removeTodo', () => {
    it('should call removeTodoFromWorkPlan with correct parameters', async () => {
      const todoId = '50';
      await controller.removeTodo(todoId, mockRequest);
      expect(service.removeTodoFromWorkPlan).toHaveBeenCalledWith(50, 1);
    });
  });
});
