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
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Permission restrictions removed - always allow access to authenticated users
  console.log(`ModuleAccessGuard: Allowing access to module '${module}' without permission check`)
  return <>{children}</>
}