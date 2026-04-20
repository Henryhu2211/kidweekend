// ============================================================
// require-permission.decorator.ts — @RequirePermission('places:write')
// ============================================================
import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS } from './admin-rbac.constants';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export const RequirePermission = (permission: keyof typeof PERMISSIONS | string) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);
