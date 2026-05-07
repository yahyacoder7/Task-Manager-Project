import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../../prisma/service/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
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
        CategoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'Work' };
      const userId = 1;
      (prisma.category.create as jest.Mock).mockResolvedValue({ categoryId: 1, ...dto, userId });

      const result = await service.create(userId, dto);
      expect(result.name).toBe('Work');
      expect(prisma.category.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if category name exists (P2002)', async () => {
      const dto = { name: 'Work' };
      const error = { code: 'P2002' }; // Prisma duplicate error code
      (prisma.category.create as jest.Mock).mockRejectedValue(error);

      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(1, dto)).rejects.toThrow('Category name already exists');
    });
  });
});
