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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('category')
@UseGuards(AuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('add')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  @ApiResponse({ status: 400, description: 'Category name already exists.' })
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    return this.categoryService.create(+req.user.sub, createCategoryDto);
  }

  @Get('get-all-categories')
  @ApiOperation({ summary: 'Get all categories for the current user' })
  findAll(@Req() req: any) {
    return this.categoryService.findAll(+req.user.sub);
  }

  @Get('get-one/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.categoryService.findOne(+id, +req.user.sub);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a category name' })
  @ApiParam({ name: 'id', description: 'Category ID to update' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    return this.categoryService.update(+id, updateCategoryDto, +req.user.sub);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category ID to delete' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.categoryService.remove(+id, +req.user.sub);
  }
}
