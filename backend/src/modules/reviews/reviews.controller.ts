// ============================================================
// reviews.controller.ts — 评论 API
// GET    /api/v1/places/:id/reviews  — 列表（审核通过的）
// POST   /api/v1/places/:id/reviews  — 新增
// PUT    /api/v1/reviews/:id         — 更新（作者）
// DELETE /api/v1/reviews/:id         — 删除（作者）
// POST   /api/v1/reviews/:id/helpful — 赞有帮助
// ============================================================
import {
  Controller, Get, Post, Put, Delete, Param, Body,
  UseGuards, Req, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ---------- 场所评论列表 ----------
  @Public()
  @Get('api/v1/places/:placeId/reviews')
  async listByPlace(
    @Param('placeId') placeId: string,
  ) {
    return this.reviewsService.listByPlace(placeId);
  }

  // ---------- 新增评论 ----------
  @UseGuards(JwtAuthGuard)
  @Post('api/v1/places/:placeId/reviews')
  async create(
    @Param('placeId') placeId: string,
    @Body() body: { content: string; rating: number; visitDate: string },
    @Req() req: any,
  ) {
    return this.reviewsService.create({
      placeId, userId: req.user.id, ...body,
    });
  }

  // ---------- 更新评论 ----------
  @UseGuards(JwtAuthGuard)
  @Put('api/v1/reviews/:id')
  async update(
    @Param('id') id: string,
    @Body() body: { content?: string; rating?: number; visitDate?: string },
    @Req() req: any,
  ) {
    const review = await this.reviewsService.findById(id);
    if (review.userId !== req.user.id) {
      throw new ForbiddenException('Not your review');
    }
    return this.reviewsService.update(id, body);
  }

  // ---------- 删除评论 ----------
  @UseGuards(JwtAuthGuard)
  @Delete('api/v1/reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: any) {
    const review = await this.reviewsService.findById(id);
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized');
    }
    await this.reviewsService.delete(id);
  }

  // ---------- 标记有帮助 ----------
  @UseGuards(JwtAuthGuard)
  @Post('api/v1/reviews/:id/helpful')
  @HttpCode(HttpStatus.OK)
  async helpful(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.markHelpful(id, req.user.id);
  }
}
