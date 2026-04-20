// ============================================================
// meilisearch.service.ts — 搜索服务（供 PlacesService 注入）
// ============================================================
import { Injectable, BadRequestException } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

// 允许的 filter 字段白名单
const ALLOWED_FILTERS = [
  'categoryId', 'region', 'priceType', 'indoor', 'isFeatured', 'status',
  'hasParking', 'hasToilet', 'hasFood', 'ageMin', 'ageMax',
] as const;

type FilterValue = string | number | boolean;
type FilterObject = Record<string, FilterValue>;

@Injectable()
export class MeilisearchService {
  private client: MeiliSearch;

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST!,
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }

  /**
   * 搜索输入消毒函数 (Whitelist 方式)
   * - 只允许: 中文、英文字母、数字、空格、连字符、逗号、句号
   * - 其他字符全部删除
   * - max 200字符
   */
  private sanitizeSearchInput(query: string): string {
    if (!query) return '';
    
    // 限制长度
    if (query.length > 200) {
      throw new BadRequestException('Search query too long (max 200 characters)');
    }
    
    // Whitelist: 只允许中文、英文、数字、空格、连字符、逗号、句号
    // 中文范围: \u4e00-\u9fff (基本汉字)
    const whitelistRegex = /[^a-zA-Z0-9\u4e00-\u9fff\s\-\,\.\u3000\u3001\u3002\uFF0C\uFF0E]/g;
    return query.replace(whitelistRegex, '');
  }

  /**
   * 校验 filter 参数
   * - 只允许 ALLOWED_FILTERS 中定义的字段名
   * - 值只允许 string/number/boolean
   * - 拒绝嵌套对象和数组
   */
  private validateFilters(filters: unknown): FilterObject | null {
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
      return null;
    }

    const validated: FilterObject = {};
    
    for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
      // 检查字段名是否在白名单中
      if (!ALLOWED_FILTERS.includes(key as typeof ALLOWED_FILTERS[number])) {
        throw new BadRequestException(`Filter field "${key}" is not allowed`);
      }
      
      // 检查值类型：只允许 string/number/boolean
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        throw new BadRequestException(`Filter value for "${key}" must be string, number, or boolean`);
      }
      
      validated[key] = value as FilterValue;
    }
    
    return Object.keys(validated).length > 0 ? validated : null;
  }

  async search(query: string, limit: number = 20) {
    // 消毒输入 (whitelist)
    const sanitizedQuery = this.sanitizeSearchInput(query);
    
    const index = this.client.index('places');
    const results = await index.search(sanitizedQuery, {
      limit,
      attributesToHighlight: ['nameEn', 'nameZh', 'description'],
    });
    return {
      hits: results.hits,
      query: results.query,
      processingTimeMs: results.processingTimeMs,
    };
  }

  /**
   * 带过滤条件的搜索
   * - filter 参数会被严格校验
   */
  async searchWithFilters(query: string, filters: unknown, limit: number = 20) {
    const sanitizedQuery = this.sanitizeSearchInput(query);
    const validatedFilters = this.validateFilters(filters);
    
    const index = this.client.index('places');
    
    // 构建 Meilisearch filter 字符串
    let filterString: string | undefined;
    if (validatedFilters) {
      const filterParts = Object.entries(validatedFilters).map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key} = "${value}"`;
        } else if (typeof value === 'boolean') {
          return `${key} = ${value}`;
        } else {
          return `${key} = ${value}`;
        }
      });
      filterString = filterParts.join(' AND ');
    }
    
    const results = await index.search(sanitizedQuery, {
      limit,
      filter: filterString,
      attributesToHighlight: ['nameEn', 'nameZh', 'description'],
    });
    
    return {
      hits: results.hits,
      query: results.query,
      processingTimeMs: results.processingTimeMs,
    };
  }
}
