// ============================================================
// admin.module.ts — 管理后台模块（RBAC + 审计日志）
// ============================================================
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma/prisma.module';
import { RbacGuard } from './rbac.guard';
import { AuditLogInterceptor } from './audit-log.interceptor';

@Module({
  imports: [PrismaModule],
  providers: [
    // 全局 RBAC 守卫 — 配合 @RequirePermission 装饰器使用
    { provide: APP_GUARD, useClass: RbacGuard },
    // 全局审计日志拦截器 — 自动记录管理员操作
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AdminModule {}
