import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: string[]
  error?: string
  helpText?: string
  required?: boolean
  placeholder?: string
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, helpText, required, placeholder = 'Select an option', className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-3 py-2.5 border rounded-lg text-gray-900 appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all duration-200',
              error ? 'border-red-300 bg-red-50' : 'border-gray-300',
              'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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

SelectField.displayName = 'SelectField'

export default SelectField
