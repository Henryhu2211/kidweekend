// ============================================================
// places.controller.ts — 场所 API
// ============================================================
import {
  Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe,
  PipeTransform, Injectable, BadRequestException,
} from '@nestjs/common';
import { PlacesService } from './places.service';

// ----------------------------------------------------------
// 自定义 Pipe：解析浮点数（用于经纬度）
// ----------------------------------------------------------
@Injectable()
export class ParseFloatPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new BadRequestException('Validation failed: expected a number');
    }
    return num;
  }
}

// ----------------------------------------------------------
// 自定义 Pipe：经纬度范围校验
// ----------------------------------------------------------
@Injectable()
export class ParseLatPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < -90 || num > 90) {
      throw new BadRequestException('Invalid latitude: must be between -90 and 90');
    }
    return num;
  }
}

@Injectable()
export class ParseLngPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < -180 || num > 180) {
      throw new BadRequestException('Invalid longitude: must be between -180 and 180');
    }
    return num;
  }
}

@Controller('api/v1/places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  // ---------- 列表（分页 + 筛选 + 排序） ----------
  @Get()
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('priceType') priceType?: string,
    @Query('indoor') indoor?: string,
    @Query('hasParking') hasParking?: string,
    @Query('hasFood') hasFood?: string,
    @Query('hasToilet') hasToilet?: string,
    @Query('minAge') minAge?: string,
    @Query('maxAge') maxAge?: string,
    @Query('sort', new DefaultValuePipe('createdAt')) sort?: string,
    @Query('order', new DefaultValuePipe('desc')) order?: 'asc' | 'desc',
  ) {
    const filters = {
      category, region, priceType, indoor, hasParking, hasFood, hasToilet,
      minAge: minAge ? parseInt(minAge) : undefined,
      maxAge: maxAge ? parseInt(maxAge) : undefined,
    };
    return this.placesService.list({ page, limit, filters, sort: sort || 'createdAt', order: order || 'desc' });
  }

  // ---------- 编辑精选（必须在 :id 之前） ----------
  @Get('featured')
  async featured(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.placesService.getFeatured(limit);
  }

  // ---------- 搜索（必须在 :id 之前） ----------
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) return { hits: [], query: '' };
    return this.placesService.search(query, limit);
  }

  // ---------- 附近场所（必须在 :id 之前） ----------
  @Get('nearby')
  async nearby(
    @Query('lat', ParseLatPipe) lat: number,
    @Query('lng', ParseLngPipe) lng: number,
    @Query('radius', new DefaultValuePipe(5000), ParseIntPipe) radius: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.placesService.getNearby(lat, lng, radius, limit);
  }

  // ---------- 分类列表（必须在 :id 之前） ----------
  @Get('categories/list')
  async categories() {
    return this.placesService.getCategories();
  }

  // ---------- 区域列表（必须在 :id 之前） ----------
  @Get('regions/list')
  async regions() {
    return this.placesService.getRegions();
  }

  // ---------- 详情（必须放在最后） ----------
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.placesService.findByIdOrSlug(id);
  }
}
