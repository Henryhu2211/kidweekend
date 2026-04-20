// ============================================================
// auth.service.ts
// ============================================================
import {
  Injectable, UnauthorizedException, ConflictException, BadRequestException,
  Inject, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

// Token 过期时间配置
const ACCESS_TOKEN_EXPIRY = '15m';   // access token 15分钟
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15分钟 (秒)
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // refresh token 7天

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // 初始化 Redis 连接 (用于 token 黑名单)
    this.initRedis();
  }
  
  private initRedis() {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;
    
    if (redisHost) {
      try {
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
        this.redis.on('error', (err) => {
          this.logger.warn(`Redis connection error: ${err.message}`);
        });
        this.redis.on('connect', () => {
          this.logger.log('Redis connected for token blacklist');
        });
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Redis: ${err.message}`);
      }
    } else {
      this.logger.warn('REDIS_HOST not set, token blacklist disabled');
    }
  }

  // ---------- 注册 ----------
  async register(email: string, password: string, name?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: { email, name, password: hashed },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const { accessToken, refreshToken } = await this.generateTokenPair(user.id);

    return { user, accessToken, refreshToken };
  }

  // ---------- 登录 ----------
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = await this.generateTokenPair(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id, email: user.email, name: user.name,
        avatar: user.avatar, role: user.role,
      },
    };
  }

  // ---------- Token Refresh (Rotation) ----------
  async refreshTokens(refreshToken: string) {
    // 验证 refresh token 是否存在且未过期
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotation: 旧 token 立即失效（删除）
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    // 生成新的 token pair
    const newTokens = await this.generateTokenPair(tokenRecord.userId);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  // ---------- 生成 Token Pair (Access + Refresh) ----------
  private async generateTokenPair(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Access Token: 15分钟，包含 jti 用于吊销
    const jti = uuidv4();
    const accessToken = this.jwtService.sign(
      { sub: userId, type: 'access', jti },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Refresh Token: 随机 UUID，存储在数据库
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  // ---------- Logout: Token 吊销 ----------
  async logout(userId: string, accessTokenJti: string, accessTokenExp: number, refreshToken?: string) {
    // 1. 如果提供 refreshToken，删除对应的 DB 记录
    if (refreshToken) {
      try {
        await this.prisma.refreshToken.deleteMany({
          where: { token: refreshToken, userId },
        });
      } catch {
        // 忽略删除失败
      }
    }
    
    // 2. 将 access token 的 jti 加入 Redis 黑名单
    if (this.redis && accessTokenJti) {
      const now = Math.floor(Date.now() / 1000);
      const ttl = Math.max(1, accessTokenExp - now); // token 剩余过期时间
      
      try {
        await this.redis.setex(
          `token:blacklist:${accessTokenJti}`,
          ttl,
          '1'
        );
      } catch (err: any) {
        this.logger.warn(`Failed to add token to blacklist: ${err.message}`);
      }
    }
  }

  // ---------- 检查 token 是否在黑名单中 ----------
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (!this.redis || !jti) return false;
    
    try {
      const result = await this.redis.get(`token:blacklist:${jti}`);
      return result === '1';
    } catch (err: any) {
      this.logger.warn(`Failed to check token blacklist: ${err.message}`);
      return false; // Redis 出错时不阻塞请求
    }
  }

  // ---------- 验证用户（Auth.js / JWT Guard 使用） ----------
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });
  }
}
