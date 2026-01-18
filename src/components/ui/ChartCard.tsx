import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  compact?: boolean
  className?: string
}

export default function ChartCard({
  title,
  subtitle,
  children,
  compact = false,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
        compact ? 'p-4' : 'p-5',
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}
