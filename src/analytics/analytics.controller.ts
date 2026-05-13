import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  getOverview(@Req() req: any) {
    return this.analyticsService.getOverview(+req.user.sub);
  }

  @Get('completion-trend')
  @ApiOperation({ summary: 'Get daily completion counts for charts' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getCompletionTrend(@Req() req: any, @Query('days') days?: string) {
    return this.analyticsService.getCompletionTrend(+req.user.sub, days ? +days : 7);
  }

  @Get('category-breakdown')
  @ApiOperation({ summary: 'Get task stats per category' })
  getCategoryBreakdown(@Req() req: any) {
    return this.analyticsService.getCategoryBreakdown(+req.user.sub);
  }

  @Get('time-distribution')
  @ApiOperation({ summary: 'Get task distribution by expected time' })
  getTimeDistribution(@Req() req: any) {
    return this.analyticsService.getTimeDistribution(+req.user.sub);
  }

  @Get('workplan-summary')
  @ApiOperation({ summary: 'Get all workplans with progress' })
  getWorkplanSummary(@Req() req: any) {
    return this.analyticsService.getWorkplanSummary(+req.user.sub);
  }
}
