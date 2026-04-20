// ============================================================
// search.service.ts — PostgreSQL 内置全文搜索
// 替代 Meilisearch Cloud，完全免费，部署在 Neon 上
// ============================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

/**
 * 搜索输入消毒函数 (Whitelist 方式)
 * - 只允许: 中文、英文字母、数字、空格、连字符、逗号、句号
 * - 其他字符全部删除
 * - max 200字符
 */
function sanitizeSearchInput(query: string): string {
  if (!query) return '';
  if (query.length > 200) {
    throw new BadRequestException('Search query too long (max 200 characters)');
  }
  // 中文范围: \u4e00-\u9fff
  return query.replace(/[^a-zA-Z0-9\u4e00-\u9fff\s\-\,\.\u3000\u3001\u3002\uFF0C\uFF0E]/g, '').trim();
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * PostgreSQL 全文搜索
   * - 使用 ILIKE 做模糊匹配（支持中文）
   * - 使用 ts_rank 做相关性排序
   * - 完全在 Neon 数据库内执行，无额外费用
   */
  async search(query: string, limit: number = 20) {
    const sanitized = sanitizeSearchInput(query);

    if (!sanitized) {
      return { hits: [], query: '', processingTimeMs: 0 };
    }

    const start = Date.now();

    try {
      // PostgreSQL 模糊搜索：同时匹配英文名、中文名、描述、地址
      // 注意：使用 COALESCE 处理可能为 NULL 的字段
      const places = await this.prisma.$queryRaw<
        Array<{
          id: string;
          slug: string;
          nameEn: string;
          nameZh: string;
          description: string | null;
          address: string | null;
          region: string | null;
          priceType: string;
          indoor: boolean;
          isFeatured: boolean;
          avgRating: number;
          reviewCount: number;
          categoryNameEn: string | null;
          categoryNameZh: string | null;
          categorySlug: string | null;
          imageUrl: string | null;
          rank: number;
        }>
      >`
        SELECT
          p.id,
          p.slug,
          p."nameEn",
          p."nameZh",
          p.description,
          p.address,
          p.region,
          p."priceType",
          p.indoor,
          p."isFeatured",
          p."avgRating",
          p."reviewCount",
          c."nameEn" AS "categoryNameEn",
          c."nameZh" AS "categoryNameZh",
          c.slug AS "categorySlug",
          (
            SELECT url FROM place_images pi
            WHERE pi."placeId" = p.id
            ORDER BY pi.order ASC LIMIT 1
          ) AS "imageUrl",
          -- 相关性评分：标题匹配权重更高
          (
            CASE WHEN p."nameEn" ILIKE ${'%' + sanitized + '%'} THEN 4 ELSE 0 END +
            CASE WHEN p."nameZh" ILIKE ${'%' + sanitized + '%'} THEN 4 ELSE 0 END +
            CASE WHEN p.description ILIKE ${'%' + sanitized + '%'} THEN 1 ELSE 0 END +
            CASE WHEN p.address ILIKE ${'%' + sanitized + '%'} THEN 1 ELSE 0 END +
            CASE WHEN c."nameEn" ILIKE ${'%' + sanitized + '%'} THEN 2 ELSE 0 END
          ) AS rank
        FROM places p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE p.status = 'PUBLISHED'
          AND (
            p."nameEn" ILIKE ${'%' + sanitized + '%'}
            OR p."nameZh" ILIKE ${'%' + sanitized + '%'}
            OR COALESCE(p.description, '') ILIKE ${'%' + sanitized + '%'}
            OR COALESCE(p.address, '') ILIKE ${'%' + sanitized + '%'}
            OR c."nameEn" ILIKE ${'%' + sanitized + '%'}
          )
        ORDER BY rank DESC, p."avgRating" DESC
        LIMIT ${limit}
      `;

      const processingTimeMs = Date.now() - start;

      return {
        hits: places,
        query: sanitized,
        processingTimeMs,
      };
    } catch (error) {
      console.error('Search error:', error);
      // 如果 raw query 失败，返回空结果而不是 500 错误
      return {
        hits: [],
        query: sanitized,
        processingTimeMs: Date.now() - start,
        error: 'Search temporarily unavailable',
      };
    }
  }

  /**
   * 带过滤条件的搜索（与 list 接口共用 Prisma 查询）
   * PlacesService 直接调用自己的 Prisma 查询逻辑
   */
  async searchWithFilters(
    query: string,
    filters: {
      category?: string;
      region?: string;
      priceType?: string;
      indoor?: boolean;
      hasParking?: boolean;
      hasFood?: boolean;
      hasToilet?: boolean;
      minAge?: number;
      maxAge?: number;
    },
    limit: number = 20,
  ) {
    const sanitized = sanitizeSearchInput(query);
    const skip = 0;

    const where: any = { status: 'PUBLISHED' };

    if (filters.category) where.category = { slug: filters.category };
    if (filters.region) where.region = filters.region;
    if (filters.priceType) where.priceType = filters.priceType;
    if (filters.indoor !== undefined) where.indoor = filters.indoor;
    if (filters.hasParking !== undefined) where.hasParking = filters.hasParking;
    if (filters.hasFood !== undefined) where.hasFood = filters.hasFood;
    if (filters.hasToilet !== undefined) where.hasToilet = filters.hasToilet;
    if (filters.minAge !== undefined) where.ageMin = { gte: filters.minAge };
    if (filters.maxAge !== undefined) where.ageMax = { lte: filters.maxAge };

    // 关键词过滤（模糊匹配）
    if (sanitized) {
      where.OR = [
        { nameEn: { contains: sanitized, mode: 'insensitive' } },
        { nameZh: { contains: sanitized } },
        { namePinyin: { contains: sanitized, mode: 'insensitive' } },
        { description: { contains: sanitized, mode: 'insensitive' } },
        { address: { contains: sanitized, mode: 'insensitive' } },
      ];
    }

    const [places, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        include: {
          category: true,
          images: { where: {}, orderBy: { order: 'asc' }, take: 3 },
        },
        orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.place.count({ where }),
    ]);

    return {
      hits: places,
      query: sanitized,
      total,
      processingTimeMs: 0,
    };
  }
}
