// ============================================================
// places.module.ts — 场所模块
// ============================================================
import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SearchModule } from '../../common/search/search.module';

@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
