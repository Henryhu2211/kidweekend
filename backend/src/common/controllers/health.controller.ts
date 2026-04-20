// ============================================================
// health.controller.ts — 健康检查端点
// GET /health — 用于 Docker HEALTHCHECK 和负载均衡器探测
// ============================================================
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
