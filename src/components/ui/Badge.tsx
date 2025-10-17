import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'
}

export default function Badge({
  children,
  variant = 'default',
  className,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'badge-default',
    secondary: 'badge-secondary',
    success: 'badge-success',
    warning: 'badge-warning',
    destructive: 'badge-destructive',
  }

  return (
    <div
      className={cn(
        'badge',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}