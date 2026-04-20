// ============================================================
// public.decorator.ts — 公开路由装饰器
// 配合 RateLimitGuard/JwtAuthGuard 使用，标记无需认证的路由
// ============================================================
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
