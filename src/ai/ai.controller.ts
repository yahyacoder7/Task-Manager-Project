import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('AI Advice')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('get-task-advice/:todoId')
  async getTaskAdvice(@Param('todoId') todoId: number, @Req() req: any) {
    return this.aiService.getTaskAdvice(+todoId, +req.user.sub);
  }
}
