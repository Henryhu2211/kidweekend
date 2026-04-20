// ============================================================
// prisma.service.ts — Prisma Service（PostgreSQL 原生）
// 移除了 Meilisearch 依赖，改用 PostgreSQL 内置全文搜索
// ============================================================
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * 全量事务辅助方法
   * 用于需要原子性操作的高频写入场景（如评分更新）
   */
  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}
