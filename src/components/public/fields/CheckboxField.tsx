import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
  error?: string
  helpText?: string
}

const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, description, error, helpText, className, ...props }, ref) => {
    return (
      <div className={cn('space-y-1', className)}>
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              className={cn(
                'h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded',
                'transition-colors duration-200',
                error && 'border-red-300'
              )}
              aria-invalid={!!error}
              {...props}
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </label>
        {error && (
          <p className="text-sm text-red-600 ml-7" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p className="text-xs text-gray-500 ml-7">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

CheckboxField.displayName = 'CheckboxField'

export default CheckboxField
