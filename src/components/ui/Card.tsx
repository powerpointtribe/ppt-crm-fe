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
        'card',
        hoverable && 'hover:bg-muted/50 cursor-pointer',
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