import { forwardRef, useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

interface RatingFieldProps {
  label: string
  value?: number
  onChange?: (value: number) => void
  error?: string
  helpText?: string
  required?: boolean
  maxRating?: number
  className?: string
}

const RatingField = forwardRef<HTMLDivElement, RatingFieldProps>(
  ({ label, value = 0, onChange, error, helpText, required, maxRating = 5, className }, ref) => {
    const [hovered, setHovered] = useState<number | null>(null)

    const displayValue = hovered !== null ? hovered : value

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-1" role="radiogroup" aria-label={label}>
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange?.(rating)}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'p-1 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded',
                'hover:scale-110'
              )}
              aria-label={`${rating} star${rating !== 1 ? 's' : ''}`}
              aria-pressed={value === rating}
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors duration-150',
                  displayValue >= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
          {value > 0 && (
            <span className="ml-2 self-center text-sm text-gray-600">
              {value} / {maxRating}
            </span>
          )}
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

RatingField.displayName = 'RatingField'

export default RatingField
