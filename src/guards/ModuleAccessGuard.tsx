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
  const { isAuthenticated, member, canAccessModule } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Check if member can access the module
  const hasAccess = canAccessModule(module)
  console.log(`ModuleAccessGuard: Checking module '${module}', Access: ${hasAccess}`)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}