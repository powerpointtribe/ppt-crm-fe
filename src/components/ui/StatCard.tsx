import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { COLOR_CLASSES, ColorKey } from '@/constants/theme'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    direction: 'up' | 'down'
    value: string
  }
  color?: ColorKey
  className?: string
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-lg', COLOR_CLASSES[color])}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
