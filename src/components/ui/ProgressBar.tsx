import { cn } from '@/utils/cn'
import { COLORS } from '@/constants/theme'

interface ProgressBarProps {
  value: number // 0-100
  color?: keyof typeof COLORS | string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

export default function ProgressBar({
  value,
  color = 'primary',
  size = 'md',
  animated = true,
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(value, 0), 100)

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  // Get color - either from COLORS constant or use as-is if it's a hex/CSS color
  const barColor = color in COLORS ? COLORS[color as keyof typeof COLORS] : color

  return (
    <div className={cn('space-y-1', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {label || ''}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            animated && 'transition-all duration-500'
          )}
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  )
}

// Variant with label showing value out of total
interface LabeledProgressBarProps {
  label: string
  value: number
  total: number
  color?: string
  className?: string
}

export function LabeledProgressBar({
  label,
  value,
  total,
  color = COLORS.primary,
  className,
}: LabeledProgressBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
