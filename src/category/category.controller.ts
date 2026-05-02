import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('category')
@UseGuards(AuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('add')
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.categoryService.create(+userId, createCategoryDto);
  }

  @Get('get-all-categories')
  findAll(@Req() req: any) {
    return this.categoryService.findAll(req.user.sub);
  }

  @Get('get-one/:id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Patch('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = this.categoryService.update(+id, updateCategoryDto);
    return {
      message: 'Category updated successfully',
      category,
    };
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    this.categoryService.remove(+id);
    return {
      message: 'Category deleted successfully',
    };
  }
}
