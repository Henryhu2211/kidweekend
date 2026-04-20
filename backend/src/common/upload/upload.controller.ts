// ============================================================
// upload.controller.ts — 图片上传 API
// POST /api/v1/upload/image — 单图上传
// ============================================================
import {
  Controller, Post, UseInterceptors, UploadedFile,
  BadRequestException, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { validateAndSanitizeImage, getMaxFileSize, isAllowedExtension } from '../utils/upload.utils';

@Controller('api/v1/upload')
export class UploadController {
  
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(), // 使用内存存储以便校验 Magic Bytes
      limits: {
        fileSize: getMaxFileSize(), // 5MB
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // 1. 检查 MIME 类型
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          callback(new BadRequestException('Only JPEG, PNG, GIF, WebP images are allowed'), false);
          return;
        }

        // 2. 检查文件扩展名（双保险，防止 multipart 伪造）
        if (!isAllowedExtension(file.originalname)) {
          callback(new BadRequestException('Invalid file extension. Allowed: jpg, jpeg, png, gif, webp'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    // 校验图片 (Magic Bytes + 大小 + 扩展名 + 尺寸 + 生成 UUID 文件名)
    const result = validateAndSanitizeImage(file);
    
    if (!result.isValid) {
      throw new BadRequestException(result.error);
    }

    // TODO: 这里可以添加实际的文件存储逻辑 (Cloudflare R2, S3 等)
    // 目前返回生成的 UUID 文件名供前端使用
    return {
      success: true,
      filename: result.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      dimensions: result.dimensions,
      // 实际项目中这里返回上传后的 URL
      url: `/uploads/${result.filename}`,
    };
  }
}
