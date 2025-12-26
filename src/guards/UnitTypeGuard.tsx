import React from 'react'
import { PermissionGuard } from './PermissionGuard'

interface UnitTypeGuardProps {
  allowedUnitTypes: ('gia' | 'district' | 'ministry_unit' | 'leadership_unit')[]
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * UnitTypeGuard - Guards routes/components based on unit type access
 * DEPRECATED: Use PermissionGuard instead for strict permissions-based access
 *
 * This guard now uses units:view permission for all unit type access
 * Unit type filtering should be done at the data level, not access control level
 */
export const UnitTypeGuard: React.FC<UnitTypeGuardProps> = ({
  allowedUnitTypes,
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  // For strict permissions-based access, check units:view permission
  // Unit type filtering should be done in the backend/data layer
  return (
    <PermissionGuard
      permission="units:view"
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </PermissionGuard>
  )
}