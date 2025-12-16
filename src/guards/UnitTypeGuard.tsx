import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface UnitTypeGuardProps {
  allowedUnitTypes: ('gia' | 'district' | 'ministry_unit' | 'leadership_unit')[]
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const UnitTypeGuard: React.FC<UnitTypeGuardProps> = ({
  allowedUnitTypes,
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  const { isAuthenticated, member } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Check if member's unit type matches allowed types
  const memberUnitType = member.unitType
  const hasAccess = memberUnitType && allowedUnitTypes.includes(memberUnitType as any)

  console.log(`UnitTypeGuard: Member unit type: ${memberUnitType}, Allowed: ${allowedUnitTypes.join(', ')}, Access: ${hasAccess}`)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}