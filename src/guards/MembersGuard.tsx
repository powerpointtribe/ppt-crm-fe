import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface MembersGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const MembersGuard: React.FC<MembersGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Permission restrictions removed - always allow access to authenticated users
  console.log('MembersGuard: Allowing access without permission check')
  return <>{children}</>
}