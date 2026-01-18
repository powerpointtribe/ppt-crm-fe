import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
  /** Use elevated style with stronger shadow for mobile list items */
  elevated?: boolean
}

export default function Card({ children, className, hoverable = false, onClick, elevated = false }: CardProps) {
  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200',
        elevated
          ? 'border-gray-100 dark:border-gray-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15),0_4px_6px_-4px_rgba(0,0,0,0.1)]'
          : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md',
        hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={hoverable || onClick ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}