import { Test, TestingModule } from '@nestjs/testing';
import { WorkPlanService } from './work-plan.service';
import { PrismaService } from '../../prisma/service/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WorkPlanService', () => {
  let service: WorkPlanService;
  let prisma: PrismaService;

  // Mocking PrismaService to avoid real database calls
  const mockPrismaService = {
    workplan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    todo: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkPlanService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WorkPlanService>(WorkPlanService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Security Check: Task Assignment', () => {
    it('should throw BadRequestException if tasks are already assigned to another plan', async () => {
      const userId = 1;
      const todoIds = [10, 20];
      
      // Simulate that only 1 task is actually free/owned (validCount = 1 instead of 2)
      (prisma.todo.count as jest.Mock).mockResolvedValue(1);

      await expect(
        service.create({ name: 'Test Plan', todoIds }, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should succeed if all tasks are free and belong to the user', async () => {
      const userId = 1;
      const todoIds = [10, 20];
      
      (prisma.todo.count as jest.Mock).mockResolvedValue(2); // Both are valid
      (prisma.workplan.create as jest.Mock).mockResolvedValue({ workplanId: 1, name: 'Test Plan' });

      const result = await service.create({ name: 'Test Plan', todoIds }, userId);
      expect(result).toBeDefined();
      expect(prisma.workplan.create).toHaveBeenCalled();
    });
  });

  describe('Progress Calculation Logic', () => {
    it('should calculate 50% progress correctly', async () => {
      const userId = 1;
      const workplanId = 100;
      
      const mockWorkplan = {
        workplanId: 100,
          name: 'Test Progress',
        _count: { todo: 2 }, // Total 2 tasks
        todo: [
          { todoId: 1, isCompleted: true },
          { todoId: 2, isCompleted: false },
        ],
      };

      (prisma.workplan.findUnique as jest.Mock).mockResolvedValue(mockWorkplan);

      const result = await service.getWorkPlanDetailsWithProgress(userId, workplanId);
      
      expect(result.progressState.percOfCompletedTodos).toBe(50);
      expect(result.progressState.completedTodos).toBe(1);
      expect(result.progressState.totalTodos).toBe(2);
    });
  });
});
