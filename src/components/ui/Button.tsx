import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  asChild = false,
  ...props
}, ref) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    destructive: 'btn-destructive',
  }

  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  const Component = asChild ? motion.div : motion.button

  return (
    <Component
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        loading && 'pointer-events-none',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 spinner" />
      )}
      {children}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button