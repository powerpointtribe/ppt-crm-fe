import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface LeadershipGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  allowDistrictPastors?: boolean
  allowUnitHeads?: boolean
  allowChamps?: boolean
  allowPastors?: boolean
  allowAdmins?: boolean
}

export const LeadershipGuard: React.FC<LeadershipGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard',
  allowDistrictPastors = true,
  allowUnitHeads = true,
  allowChamps = true,
  allowPastors = true,
  allowAdmins = true
}) => {
  const { isAuthenticated, member } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Leadership restrictions removed - always allow access to authenticated users
  console.log('LeadershipGuard: Allowing access without leadership check')
  return <>{children}</>
}