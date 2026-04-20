// ============================================================
// upload.module.ts — 上传模块
// ============================================================
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
})
export class UploadModule {}
