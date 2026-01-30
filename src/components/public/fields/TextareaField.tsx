import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helpText?: string
  required?: boolean
}

const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, helpText, required, className, rows = 3, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-3 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200 resize-y',
            error ? 'border-red-300 bg-red-50' : 'border-gray-300',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
          {...props}
        />
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

TextareaField.displayName = 'TextareaField'

export default TextareaField
