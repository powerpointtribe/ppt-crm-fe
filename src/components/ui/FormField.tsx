import { ReactNode } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface FormFieldProps {
  children: ReactNode
  label: string
  icon?: ReactNode
  required?: boolean
  error?: string
  success?: boolean
  hint?: string
  className?: string
}

export default function FormField({
  children,
  label,
  icon,
  required = false,
  error,
  success = false,
  hint,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
        {success && <Check className="w-3 h-3 text-green-500" />}
      </label>

      <div className="relative">
        {children}

        {/* Success indicator */}
        {success && !error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Check className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  )
}