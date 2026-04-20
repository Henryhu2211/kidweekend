// ============================================================
// places.service.ts
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../../common/search/search.service';

interface ListParams {
  page: number;
  limit: number;
  filters: {
    category?: string;
    region?: string;
    priceType?: string;
    indoor?: string;
    hasParking?: string;
    hasFood?: string;
    hasToilet?: string;
    minAge?: number;
    maxAge?: number;
  };
  sort: string;
  order: 'asc' | 'desc';
}

@Injectable()
export class PlacesService {
  constructor(
    private prisma: PrismaService,
    private search: SearchService,
  ) {}

  // ---------- 列表 ----------
  async list({ page, limit, filters, sort, order }: ListParams) {
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (filters.category) where.category = { slug: filters.category };
    if (filters.region) where.region = filters.region;
    if (filters.priceType) where.priceType = filters.priceType as any;
    if (filters.indoor !== undefined) where.indoor = filters.indoor === 'true';
    if (filters.hasParking) where.hasParking = filters.hasParking === 'true';
    if (filters.hasFood) where.hasFood = filters.hasFood === 'true';
    if (filters.hasToilet) where.hasToilet = filters.hasToilet === 'true';
    if (filters.minAge !== undefined) where.ageMin = { gte: filters.minAge };
    if (filters.maxAge !== undefined) where.ageMax = { lte: filters.maxAge };

    const orderBy = { [sort]: order };

    const [places, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { order: 'asc' }, take: 3 },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.place.count({ where }),
    ]);

    return {
      data: places,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------- 详情（id 或 slug） ----------
  async findByIdOrSlug(idOrSlug: string) {
    const place = await this.prisma.place.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        category: true,
        tags: true,
        images: { orderBy: { order: 'asc' } },
        openingHours: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  // ---------- 编辑精选 ----------
  async getFeatured(limit: number) {
    return this.prisma.place.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      include: { category: true, images: { take: 1, orderBy: { order: 'asc' } } },
      take: limit,
      orderBy: { avgRating: 'desc' },
    });
  }

  // ---------- 搜索（PostgreSQL 全文搜索） ----------
  async search(query: string, limit: number) {
    return this.search.search(query, limit);
  }

  // ---------- 附近场所（PostgreSQL Haversine） ----------
  async getNearby(lat: number, lng: number, radiusMeters: number, limit: number) {
    // Haversine 公式（km），PostgreSQL 支持
    const radiusKm = radiusMeters / 1000;

    // Raw SQL 返回扁平字段（categoryNameEn, categoryNameZh），需要组装为嵌套对象
    const places = await this.prisma.$queryRaw<
      Array<{
        id: string;
        nameEn: string;
        nameZh: string;
        address: string;
        lat: number;
        lng: number;
        distance: number;
        avgRating: number;
        categoryNameEn: string | null;
        categoryNameZh: string | null;
      }>
    >`
      SELECT
        p.id, p.name_en AS "nameEn", p.name_zh AS "nameZh",
        p.address, p.lat, p.lng,
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(p.lat))
        )) AS distance,
        p.avg_rating AS "avgRating",
        c.name_en AS "categoryNameEn", c.name_zh AS "categoryNameZh"
      FROM places p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'PUBLISHED'
        AND (6371 * acos(
          cos(radians(${lat})) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(p.lat))
        )) < ${radiusKm}
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    // 将扁平字段组装成嵌套 category 对象
    return {
      data: places.map(p => ({
        id: p.id,
        nameEn: p.nameEn,
        nameZh: p.nameZh,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        distance: p.distance,
        avgRating: p.avgRating,
        category: p.categoryNameEn
          ? { nameEn: p.categoryNameEn, nameZh: p.categoryNameZh }
          : null,
      })),
    };
  }

  // ---------- 分类列表 ----------
  async getCategories() {
    return this.prisma.category.findMany({
      include: { _count: { select: { places: true } } },
      orderBy: { order: 'asc' },
    });
  }

  // ---------- 区域列表 ----------
  async getRegions() {
    const places = await this.prisma.place.groupBy({
      by: ['region'],
      where: { status: 'PUBLISHED' },
      _count: true,
    });
    return places.map(p => ({ region: p.region, count: p._count }));
  }
}
