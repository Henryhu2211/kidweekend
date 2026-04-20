// ============================================================
// rbac.guard.ts — RBAC 权限守卫
// ============================================================
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from './require-permission.decorator';
import { ROLE_PERMISSIONS } from './admin-rbac.constants';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.role) throw new ForbiddenException('No role assigned');

    const allowed: string[] = ROLE_PERMISSIONS[user.role] ?? [];
    if (!allowed.includes(requiredPermission)) {
      throw new ForbiddenException(`Permission denied: ${requiredPermission}`);
    }
    return true;
  }
}
