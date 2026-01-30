import { forwardRef } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DateFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
  required?: boolean
}

const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, error, helpText, required, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={ref}
            type="date"
            className={cn(
              'w-full pl-10 pr-3 py-2.5 border rounded-lg text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all duration-200',
              error ? 'border-red-300 bg-red-50' : 'border-gray-300',
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

DateField.displayName = 'DateField'

export default DateField
