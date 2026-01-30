import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
  required?: boolean
  icon?: React.ReactNode
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helpText, required, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            className={cn(
              'w-full px-3 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all duration-200',
              error ? 'border-red-300 bg-red-50' : 'border-gray-300',
              icon && 'pl-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${props.id}-help`} className="text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

TextField.displayName = 'TextField'

export default TextField
