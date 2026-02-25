export { ModuleAccessGuard } from './ModuleAccessGuard'
export { PermissionGuard } from './PermissionGuard'

// Common guard combinations for specific modules
export { FirstTimersGuard } from './FirstTimersGuard'
export { MembersGuard } from './MembersGuard'
export { AdminGuard } from './AdminGuard'

// NOTE: RoleGuard, LeadershipGuard, and UnitTypeGuard have been deprecated.
// Use PermissionGuard instead for strict permissions-based access control.