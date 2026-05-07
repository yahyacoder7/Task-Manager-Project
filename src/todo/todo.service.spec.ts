import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './todo.service';
import { PrismaService } from '../../prisma/service/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('TodoService', () => {
  let service: TodoService;
  let prisma: PrismaService;

  const mockPrismaService = {
    todo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new todo', async () => {
      const dto = { title: 'Test Todo' };
      const userId = 1;
      (prisma.todo.create as jest.Mock).mockResolvedValue({ todoId: 1, ...dto, userId });

      const result = await service.create(dto as any, userId);
      expect(result.todoId).toBe(1);
      expect(prisma.todo.create).toHaveBeenCalled();
    });
  });

  describe('getAvailableTodos', () => {
    it('should return only todos where workplanId is null', async () => {
      const userId = 1;
      const mockTodos = [{ todoId: 1, workplanId: null }];
      (prisma.todo.findMany as jest.Mock).mockResolvedValue(mockTodos);

      const result = await service.getAvailableTodos(userId);
      expect(result).toHaveLength(1);
      expect(prisma.todo.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId, workplanId: null }
      }));
    });
  });

  describe('completeTodo', () => {
    it('should calculate next date for daily recurring todo', async () => {
      const userId = 1;
      const todoId = 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Yesterday

      const mockTodo = {
        todoId,
        userId,
        isCompleted: false,
        repeatUnit: 'DAILY',
        repeatInterval: 1,
        startDate: startDate,
      };

      (prisma.todo.findUnique as jest.Mock).mockResolvedValue(mockTodo);
      (prisma.todo.update as jest.Mock).mockResolvedValue({ ...mockTodo, isCompleted: true });

      await service.completeTodo(todoId, userId);

      // Verify that update was called with a new startDate (future date)
      expect(prisma.todo.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          isCompleted: true,
          startDate: expect.any(Date),
        })
      }));
      
      const updatedData = (prisma.todo.update as jest.Mock).mock.calls[0][0].data;
      expect(updatedData.startDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it('should throw error if todo is already completed', async () => {
      (prisma.todo.findUnique as jest.Mock).mockResolvedValue({ isCompleted: true });
      await expect(service.completeTodo(1, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
