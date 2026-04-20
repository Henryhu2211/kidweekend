// ============================================================
// admin-rbac.constants.ts — RBAC 权限定义
// ============================================================

export const PERMISSIONS = {
  PLACES_READ: 'places:read',
  PLACES_WRITE: 'places:write',
  REVIEWS_MODERATE: 'reviews:moderate',
  USERS_MANAGE: 'users:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  EDITOR: [
    PERMISSIONS.PLACES_READ,
    PERMISSIONS.PLACES_WRITE,
    PERMISSIONS.REVIEWS_MODERATE,
  ],
  ADMIN: [
    PERMISSIONS.PLACES_READ,
    PERMISSIONS.PLACES_WRITE,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.USERS_MANAGE,
  ],
};
