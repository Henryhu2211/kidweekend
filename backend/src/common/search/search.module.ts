// ============================================================
// search.module.ts — 搜索模块（PostgreSQL 全文搜索）
// ============================================================
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SearchService } from './search.service';

@Module({
  imports: [PrismaModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
