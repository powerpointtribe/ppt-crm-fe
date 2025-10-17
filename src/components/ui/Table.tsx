import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface TableProps {
  children: ReactNode
  className?: string
}

interface TableHeaderProps {
  children: ReactNode
}

interface TableBodyProps {
  children: ReactNode
}

interface TableRowProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

interface TableCellProps {
  children: ReactNode
  className?: string
}

interface TableHeadProps {
  children: ReactNode
  className?: string
  sortable?: boolean
  onSort?: () => void
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('table', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children }: TableHeaderProps) {
  return <thead>{children}</thead>
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children, onClick, className }: TableRowProps) {
  const Component = onClick ? motion.tr : 'tr'

  return (
    <Component
      className={cn(onClick && 'cursor-pointer', className)}
      onClick={onClick}
      whileHover={onClick ? { backgroundColor: 'rgba(249, 250, 251, 1)' } : undefined}
    >
      {children}
    </Component>
  )
}

export function TableHead({ children, className, sortable, onSort }: TableHeadProps) {
  return (
    <th
      className={cn(
        'text-left',
        sortable && 'cursor-pointer hover:bg-gray-50 select-none',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className }: TableCellProps) {
  return <td className={className}>{children}</td>
}