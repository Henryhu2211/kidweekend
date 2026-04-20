// ============================================================
// favorites.service.ts — 收藏业务逻辑
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  // ---------- 切换收藏状态 ----------
  async toggle(userId: string, placeId: string) {
    // 确认场所存在
    const place = await this.prisma.place.findUnique({ where: { id: placeId } });
    if (!place) throw new NotFoundException('Place not found');

    // 查找是否已收藏
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });

    if (existing) {
      // 已收藏 → 取消
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    } else {
      // 未收藏 → 添加
      await this.prisma.favorite.create({
        data: { userId, placeId },
      });
      return { favorited: true };
    }
  }

  // ---------- 我的收藏列表（分页） ----------
  async list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          place: {
            select: {
              id: true,
              slug: true,
              nameEn: true,
              nameZh: true,
              address: true,
              region: true,
              priceType: true,
              indoor: true,
              avgRating: true,
              category: { select: { nameEn: true, nameZh: true } },
              images: {
                where: { order: 0 },
                take: 1,
                select: { url: true, caption: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      data: favorites,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------- 检查是否已收藏 ----------
  async isFavorited(userId: string, placeId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });
    return { favorited: !!favorite };
  }
}
