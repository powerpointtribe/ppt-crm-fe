import React from 'react'
import { ModuleAccessGuard } from './ModuleAccessGuard'
import { UnitTypeGuard } from './UnitTypeGuard'
import { LeadershipGuard } from './LeadershipGuard'

interface FirstTimersGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const FirstTimersGuard: React.FC<FirstTimersGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  return (
    <ModuleAccessGuard
      module="first_timers"
      fallback={
        // If they can't access via module permission, check if they're GIA or leadership
        <UnitTypeGuard
          allowedUnitTypes={['gia']}
          fallback={
            <LeadershipGuard
              allowDistrictPastors={true}
              allowUnitHeads={true}
              allowChamps={false}
              allowPastors={true}
              allowAdmins={true}
              fallback={fallback}
              redirectTo={redirectTo}
            >
              {children}
            </LeadershipGuard>
          }
          redirectTo={redirectTo}
        >
          {children}
        </UnitTypeGuard>
      }
      redirectTo={redirectTo}
    >
      {children}
    </ModuleAccessGuard>
  )
}