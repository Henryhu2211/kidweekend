// ============================================================
// favorites.controller.ts — 收藏 API
// POST   /api/v1/places/:placeId/favorite  — 切换收藏状态
// GET    /api/v1/users/me/favorites        — 我的收藏列表
// GET    /api/v1/places/:placeId/favorite   — 检查是否已收藏
// ============================================================
import {
  Controller, Get, Post, Param, Query, UseGuards, Req,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // ---------- 切换收藏状态 ----------
  @UseGuards(JwtAuthGuard)
  @Post('api/v1/places/:placeId/favorite')
  async toggle(@Param('placeId') placeId: string, @Req() req: any) {
    return this.favoritesService.toggle(req.user.id, placeId);
  }

  // ---------- 检查是否已收藏 ----------
  @UseGuards(JwtAuthGuard)
  @Get('api/v1/places/:placeId/favorite')
  async checkFavorited(@Param('placeId') placeId: string, @Req() req: any) {
    return this.favoritesService.isFavorited(req.user.id, placeId);
  }

  // ---------- 我的收藏列表（分页） ----------
  @UseGuards(JwtAuthGuard)
  @Get('api/v1/users/me/favorites')
  async list(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.favoritesService.list(req.user.id, page, limit);
  }
}
