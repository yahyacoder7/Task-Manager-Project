import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: number, createCategoryDto: CreateCategoryDto) {
    return await this.prismaService.category
      .create({
        data: { ...createCategoryDto, userId: userId },
      })
      .catch((error) => {
        if (error.code === 'P2002') {
          throw new BadRequestException('Category name already exists');
        }
        throw new BadRequestException('Failed to create category');
      });
  }

  async findAll(userId: number) {
    return await this.prismaService.category.findMany({
      where: { userId: userId },
    });
  }

  async findOne(id: number, userId?: number) {
    const category = await this.prismaService.category.findUnique({
      where: { categoryId: id, ...(userId && { userId }) },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, userId: number) {
    await this.findOne(id, userId);

    return await this.prismaService.category
      .update({
        where: { categoryId: id },
        data: updateCategoryDto,
      })
      .catch(() => {
        throw new BadRequestException('Failed to update category');
      });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    return await this.prismaService.category.delete({
      where: { categoryId: id },
    });
  }
}
