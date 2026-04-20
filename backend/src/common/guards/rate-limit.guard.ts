// ============================================================
// rate-limit.guard.ts — Redis 速率限制 Guard (P0 Security Fix)
// -----------------------------------------------------------
// 改动说明：
//   - P0-1: fail-open → fail-closed
//     Redis 不可用时拒绝请求（503），而非放行。
//   - 内存级降级：Redis 挂了后用内存 Map 做 10 req/min/IP 限流。
//   - Redis 恢复后自动切回 Redis 限流。
// ============================================================
import {
  Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';

// ---------- 内存级限流器（Redis 降级备用） ----------
class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();
  private readonly WINDOW_MS = 60_000;
  private readonly MAX_REQUESTS = 10;

  isHealthy(): boolean {
    return true;
  }

  consume(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    let entry = this.store.get(ip);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + this.WINDOW_MS };
      this.store.set(ip, entry);
    }

    entry.count++;
    const remaining = Math.max(0, this.MAX_REQUESTS - entry.count);
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);

    if (entry.count > this.MAX_REQUESTS) {
      return { allowed: false, remaining: 0, resetIn };
    }
    return { allowed: true, remaining, resetIn };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) this.store.delete(key);
    }
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;
  private readonly WINDOW_MS = 60_000;
  private readonly MAX_REQUESTS = 100;
  private readonly FALLBACK_REQUESTS = 10;
  private inMemoryLimiter = new InMemoryRateLimiter();
  private redisAvailable = false;
  private lastRedisCheck = 0;
  private readonly REDIS_CHECK_INTERVAL_MS = 10_000;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT ?? '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
    });

    this.redis.on('connect', () => {
      this.redisAvailable = true;
      console.log('[RateLimitGuard] Redis connected');
    });

    this.redis.on('error', (err) => {
      if (this.redisAvailable) {
        console.warn('[RateLimitGuard] Redis error, fallback:', err.message);
      }
      this.redisAvailable = false;
    });

    this.redis.on('close', () => {
      this.redisAvailable = false;
      console.warn('[RateLimitGuard] Redis connection closed');
    });

    this.checkRedisConnection().catch(() => {});
    setInterval(() => this.inMemoryLimiter.cleanup(), 120_000);
  }

  private async checkRedisConnection(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastRedisCheck < this.REDIS_CHECK_INTERVAL_MS) {
      return this.redisAvailable;
    }
    this.lastRedisCheck = now;

    try {
      await this.redis.ping();
      this.redisAvailable = true;
      return true;
    } catch {
      this.redisAvailable = false;
      return false;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);

    await this.checkRedisConnection();

    if (this.redisAvailable) {
      return this.rateLimitWithRedis(context, ip);
    } else {
      return this.rateLimitWithMemory(context, ip);
    }
  }

  private async rateLimitWithRedis(context: ExecutionContext, ip: string): Promise<boolean> {
    const key = `ratelimit:${ip}`;

    try {
      const count = await this.redis.incr(key);

      if (count === 1) {
        await this.redis.pexpire(key, this.WINDOW_MS);
      }

      const ttl = await this.redis.pttl(key);
      const remaining = Math.max(0, this.MAX_REQUESTS - count);
      const resetAt = Date.now() + (ttl > 0 ? ttl : this.WINDOW_MS);

      this.setHeaders(context, this.MAX_REQUESTS, remaining, resetAt);

      if (count > this.MAX_REQUESTS) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((ttl > 0 ? ttl : this.WINDOW_MS) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      console.warn('[RateLimitGuard] Redis command failed, fallback:', (err as Error).message);
      this.redisAvailable = false;
      return this.rateLimitWithMemory(context, ip);
    }
  }

  private rateLimitWithMemory(context: ExecutionContext, ip: string): boolean {
    const result = this.inMemoryLimiter.consume(ip);
    const resetAt = Date.now() + result.resetIn * 1000;

    this.setHeaders(context, this.FALLBACK_REQUESTS, result.remaining, resetAt);

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Rate limiting service temporarily unavailable. Please try again later.',
          retryAfter: result.resetIn,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return true;
  }

  private setHeaders(context: ExecutionContext, limit: number, remaining: number, resetAt: number) {
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
