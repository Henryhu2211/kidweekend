// ============================================================
// audit-log.interceptor.ts — 审计日志拦截器
// ============================================================
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const handler = context.getHandler();
    const controller = context.getClass();

    if (!user) return next.handle();

    const action = `${controller.name}.${handler.name}`;
    const resource = request.params?.id ?? request.params?.placeId ?? null;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action,
              resource: controller.name.replace('Controller', '').toLowerCase(),
              resourceId: resource,
              details: {
                method: request.method,
                url: request.url,
                body: request.body ? JSON.stringify(request.body).slice(0, 2000) : undefined,
              },
              ip: request.ip ?? request.headers?.['x-forwarded-for'] ?? null,
            },
          });
        } catch (err) {
          // 审计日志写入失败不应阻塞业务
          console.error('AuditLog write failed:', err);
        }
      }),
    );
  }
}
