import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireAll?: boolean // If true, member must have ALL roles. If false, just one role is enough
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
  redirectTo = '/dashboard',
  requireAll = false
}) => {
  const { hasSystemRole, isAuthenticated, member } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  const hasAccess = requireAll
    ? allowedRoles.every(role => hasSystemRole(role))
    : allowedRoles.some(role => hasSystemRole(role))

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}