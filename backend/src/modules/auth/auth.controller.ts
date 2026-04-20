// ============================================================
// auth.controller.ts — 认证 API
// POST /api/v1/auth/register   — 注册
// POST /api/v1/auth/login      — 登录
// POST /api/v1/auth/refresh    — Token 刷新 (Rotation)
// GET  /api/v1/auth/me         — 当前用户
// ============================================================
import {
  Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------- 注册 ----------
  @Public()
  @Post('register')
  async register(@Body() body: { email: string; password: string; name?: string }) {
    return this.authService.register(body.email, body.password, body.name);
  }

  // ---------- 登录 ----------
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // ---------- Token 刷新 (Rotation) ----------
  // 使用 refresh token 获取新的 access token，旧 refresh token 立即失效
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  // ---------- Logout: Token 吊销 ----------
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Body() body?: { refreshToken?: string }) {
    // 从 JWT payload 中提取 jti 和 exp
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    let jti = '';
    let exp = 0;
    
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        jti = payload.jti || '';
        exp = payload.exp || 0;
      } catch {
        // 解析失败时仍继续（至少能清除 refresh token）
      }
    }
    
    await this.authService.logout(req.user.id, jti, exp, body?.refreshToken);
    return { message: 'Logged out successfully' };
  }

  // ---------- 当前登录用户 ----------
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return req.user;
  }
}
