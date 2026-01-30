import { forwardRef } from 'react'
import { ExternalLink } from 'lucide-react'
import { TermsAndConditions } from '@/types/registration-form'
import { cn } from '@/utils/cn'

interface TermsCheckboxProps {
  termsConfig: TermsAndConditions
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}

const TermsCheckbox = forwardRef<HTMLInputElement, TermsCheckboxProps>(
  ({ termsConfig, checked, onChange, error }, ref) => {
    if (!termsConfig.enabled) {
      return null
    }

    const defaultText = 'I agree to the terms and conditions'
    const displayText = termsConfig.text || defaultText

    return (
      <div className="space-y-1">
        <label
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200',
            checked
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300',
            error && 'border-red-300 bg-red-50'
          )}
        >
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className={cn(
                'h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded',
                'transition-colors duration-200',
                error && 'border-red-300'
              )}
              aria-invalid={!!error}
            />
          </div>
          <div className="flex-1">
            <span className="text-sm text-gray-700">
              {displayText}
              {termsConfig.linkUrl && (
                <a
                  href={termsConfig.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline ml-1 inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  Read full terms
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          </div>
        </label>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

TermsCheckbox.displayName = 'TermsCheckbox'

export default TermsCheckbox
