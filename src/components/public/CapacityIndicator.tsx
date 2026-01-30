import { Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CapacityIndicatorProps {
  currentCount: number
  maxAttendees?: number
  allowWaitlist?: boolean
}

export default function CapacityIndicator({
  currentCount,
  maxAttendees,
  allowWaitlist = false,
}: CapacityIndicatorProps) {
  if (!maxAttendees) {
    return null
  }

  const spotsRemaining = Math.max(0, maxAttendees - currentCount)
  const percentFilled = Math.min(100, (currentCount / maxAttendees) * 100)
  const isFull = spotsRemaining === 0
  const isAlmostFull = percentFilled >= 80 && !isFull

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        isFull
          ? 'bg-red-50 border-red-200'
          : isAlmostFull
          ? 'bg-amber-50 border-amber-200'
          : 'bg-green-50 border-green-200'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users
            className={cn(
              'h-5 w-5',
              isFull
                ? 'text-red-600'
                : isAlmostFull
                ? 'text-amber-600'
                : 'text-green-600'
            )}
          />
          <span
            className={cn(
              'font-medium',
              isFull
                ? 'text-red-800'
                : isAlmostFull
                ? 'text-amber-800'
                : 'text-green-800'
            )}
          >
            {isFull ? (
              allowWaitlist ? (
                'Event Full - Waitlist Available'
              ) : (
                'Event Full'
              )
            ) : (
              `${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} remaining`
            )}
          </span>
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            isFull
              ? 'text-red-600'
              : isAlmostFull
              ? 'text-amber-600'
              : 'text-green-600'
          )}
        >
          {currentCount} / {maxAttendees}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isFull
              ? 'bg-red-500'
              : isAlmostFull
              ? 'bg-amber-500'
              : 'bg-green-500'
          )}
          style={{ width: `${percentFilled}%` }}
        />
      </div>

      {/* Status Message */}
      {isFull && allowWaitlist && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Registration will add you to the waitlist
        </p>
      )}
      {!isFull && isAlmostFull && (
        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Limited spots available - Register soon!
        </p>
      )}
      {!isFull && !isAlmostFull && (
        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Spots available
        </p>
      )}
    </div>
  )
}
