import React from 'react'
import { PermissionGuard } from './PermissionGuard'

interface FirstTimersGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * FirstTimersGuard - Guards routes/components that require first-timers module access
 * Uses permissions-based access control (strict permissions)
 */
export const FirstTimersGuard: React.FC<FirstTimersGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  return (
    <PermissionGuard
      permission="first-timers:view"
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </PermissionGuard>
  )
}