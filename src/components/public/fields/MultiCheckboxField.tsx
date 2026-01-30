import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface MultiCheckboxFieldProps {
  label: string
  options: string[]
  value?: string[]
  onChange?: (value: string[]) => void
  error?: string
  helpText?: string
  required?: boolean
  className?: string
}

const MultiCheckboxField = forwardRef<HTMLDivElement, MultiCheckboxFieldProps>(
  ({ label, options, value = [], onChange, error, helpText, required, className }, ref) => {
    const handleChange = (option: string, checked: boolean) => {
      if (checked) {
        onChange?.([...value, option])
      } else {
        onChange?.(value.filter((v) => v !== option))
      }
    }

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2" role="group" aria-label={label}>
          {options.map((option) => (
            <label
              key={option}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
                value.includes(option)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={(e) => handleChange(option, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p className="text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

MultiCheckboxField.displayName = 'MultiCheckboxField'

export default MultiCheckboxField
