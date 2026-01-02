import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export default function Card({ children, className, hoverable = false, onClick }: CardProps) {
  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200',
        hoverable && 'hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer',
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