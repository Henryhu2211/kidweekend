// ============================================================
// upload.utils.ts — 图片上传安全校验工具
// ============================================================
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// 允许的图片 MIME 类型
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// 文件大小限制: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// 图片尺寸限制
const MIN_IMAGE_DIMENSION = 100;  // 最小 100px
const MAX_IMAGE_DIMENSION = 8000; // 最大 8000px

// Magic Bytes 定义
const MAGIC_BYTES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47],
  GIF: [0x47, 0x49, 0x46], // GIF87a or GIF89a
  WEBP: [0x52, 0x49, 0x46], // RIFF header for WebP
};

/**
 * 校验图片文件的 Magic Bytes
 * - JPEG: FF D8 FF
 * - PNG: 89 50 4E 47
 * - GIF: 47 49 46
 * - WebP: 52 49 46 (RIFF header)
 */
export function validateImageMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  const header = Array.from(buffer.slice(0, 4));

  // JPEG: FF D8 FF
  if (header[0] === MAGIC_BYTES.JPEG[0] &&
      header[1] === MAGIC_BYTES.JPEG[1] &&
      header[2] === MAGIC_BYTES.JPEG[2]) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (header[0] === MAGIC_BYTES.PNG[0] &&
      header[1] === MAGIC_BYTES.PNG[1] &&
      header[2] === MAGIC_BYTES.PNG[2] &&
      header[3] === MAGIC_BYTES.PNG[3]) {
    return true;
  }

  // GIF: 47 49 46
  if (header[0] === MAGIC_BYTES.GIF[0] &&
      header[1] === MAGIC_BYTES.GIF[1] &&
      header[2] === MAGIC_BYTES.GIF[2]) {
    return true;
  }

  // WebP: 52 49 46 (RIFF header, 后面应该是 'WEBP')
  if (header[0] === MAGIC_BYTES.WEBP[0] &&
      header[1] === MAGIC_BYTES.WEBP[1] &&
      header[2] === MAGIC_BYTES.WEBP[2]) {
    if (buffer.length >= 12) {
      const webpSignature = buffer.slice(8, 12).toString('ascii');
      if (webpSignature === 'WEBP') {
        return true;
      }
    }
  }

  return false;
}

/**
 * 从 buffer 解析图片尺寸（不依赖 image-size 包，直接读 header）
 * - JPEG: SOF0 marker (0xFFC0/0xFFC2)，offset 5-8
 * - PNG: IHDR chunk，offset 16-23
 * - GIF: logical screen descriptor，offset 6-9
 * - WebP: 从 VP8/VP8L chunk 读取
 */
export function parseImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (!buffer || buffer.length < 24) return null;

  const header = buffer.slice(0, 4);

  // JPEG
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    let offset = 2;
    while (offset < buffer.length - 1) {
      if (buffer[offset] !== 0xFF) { offset++; continue; }
      const marker = buffer[offset + 1];
      // SOF0 (0xC0) or SOF2 (0xC2)
      if (marker === 0xC0 || marker === 0xC2) {
        if (offset + 9 > buffer.length) return null;
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      // Skip to next marker
      if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
        offset += 2;
      } else {
        if (offset + 3 > buffer.length) return null;
        const segLen = buffer.readUInt16BE(offset + 2);
        offset += 2 + segLen;
      }
    }
    return null;
  }

  // PNG: IHDR at offset 16
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    if (buffer.length < 24) return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // GIF: logical screen descriptor at offset 6
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
    if (buffer.length < 10) return null;
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    return { width, height };
  }

  // WebP
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46) {
    if (buffer.length < 30) return null;
    const chunkHeader = buffer.slice(12, 16).toString('ascii');
    if (chunkHeader === 'VP8 ') {
      // Lossy WebP
      const width = (buffer.readUInt16LE(26) & 0x3FFF);
      const height = (buffer.readUInt16LE(28) & 0x3FFF);
      return { width, height };
    } else if (chunkHeader === 'VP8L') {
      // Lossless WebP
      if (buffer.length < 25) return null;
      const b24 = buffer[21] | (buffer[22] << 8) | (buffer[23] << 16);
      const width = (b24 & 0x3FFF) + 1;
      const height = ((b24 >> 14) & 0x3FFF) + 1;
      return { width, height };
    }
    return null;
  }

  return null;
}

/**
 * 完整的图片上传校验
 * - 校验文件大小 (max 5MB)
 * - 校验 Magic Bytes
 * - 校验文件扩展名（拒绝不在白名单中的扩展名）
 * - 校验图片尺寸 (100px ~ 8000px)
 * - 生成 UUID 文件名
 */
export function validateAndSanitizeImage(
  file: Express.Multer.File,
): { isValid: boolean; error?: string; filename?: string; dimensions?: { width: number; height: number } } {
  // 检查文件是否存在
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // 检查文件大小 (5MB limit)
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }

  // 校验 Magic Bytes
  if (!validateImageMagicBytes(file.buffer)) {
    return { isValid: false, error: 'Invalid image file format (Magic Bytes check failed)' };
  }

  // 检查 MIME 类型
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { isValid: false, error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  // 校验文件扩展名（不在白名单则拒绝，不 fallback 到 .bin）
  const originalExt = file.originalname.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
    return { isValid: false, error: `Invalid file extension ".${originalExt}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }

  // 校验图片尺寸
  const dims = parseImageDimensions(file.buffer);
  if (dims) {
    if (dims.width < MIN_IMAGE_DIMENSION || dims.height < MIN_IMAGE_DIMENSION) {
      return { isValid: false, error: `Image too small (${dims.width}x${dims.height}). Minimum: ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}px` };
    }
    if (dims.width > MAX_IMAGE_DIMENSION || dims.height > MAX_IMAGE_DIMENSION) {
      return { isValid: false, error: `Image too large (${dims.width}x${dims.height}). Maximum: ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px` };
    }
  }
  // 如果无法解析尺寸，不阻断上传（某些特殊格式可能解析失败）

  // 生成 UUID 文件名，保留原始扩展名（已确认在白名单中）
  const safeExt = originalExt === 'jpg' ? 'jpeg' : originalExt;
  const filename = `${uuidv4()}.${safeExt}`;

  return { isValid: true, filename, dimensions: dims || undefined };
}

/**
 * 检查文件扩展名是否在允许列表中（供 fileFilter 使用）
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * 获取文件大小限制 (bytes)
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}
