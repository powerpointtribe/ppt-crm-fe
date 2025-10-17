import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface ModuleAccessGuardProps {
  module: string
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({
  module,
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  const { canAccessModule, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!canAccessModule(module)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}