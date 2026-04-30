import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../../prisma/service/prisma.service';
import { BadRequestException } from '@nestjs/common';
@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const category = await this.prismaService.category.create({
        data: createCategoryDto,
      });

      return category;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Category name already exists');
      }
      throw error;
    }
  }
  // get all categories for a user with the number of todos in each category
  async findAll(userId: number) {
    const category = await this.prismaService.category.findMany({
      where: {
        userId: userId,
      },
    });
    return category;
  }
  // get a category by id
  async findOne(id: number) {
    return this.prismaService.category.findUnique({
      where: {
        categoryId: id,
      },
    });
  }
  // update a category by id
  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.prismaService.category.update({
      where: {
        categoryId: id,
        userId: updateCategoryDto.userId,
      },
      data: updateCategoryDto,
    });
  }
  // remove a category by id
  remove(id: number) {
    return this.prismaService.category.delete({
      where: {
        categoryId: id,
      },
    });
  }
}
