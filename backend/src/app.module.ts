// ============================================================
// app.module.ts — NestJS 根模块注册
// ============================================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { PlacesModule } from './modules/places/places.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadModule } from './common/upload/upload.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { HttpSecurityInterceptor } from './common/interceptors/http-security.interceptor';
import { HealthController } from './common/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // 速率限制：100 req / min / IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    PrismaModule,
    AuthModule,
    PlacesModule,
    ReviewsModule,
    AdminModule,
    UploadModule, // 图片上传模块（含安全校验）
    FavoritesModule, // 收藏模块
  ],
  controllers: [HealthController],
  providers: [
    // Redis 速率限制守卫（细粒度 IP 控制）
    { provide: APP_GUARD, useClass: RateLimitGuard },
    // 安全响应头拦截器
    { provide: APP_INTERCEPTOR, useClass: HttpSecurityInterceptor },
  ],
})
export class AppModule {}