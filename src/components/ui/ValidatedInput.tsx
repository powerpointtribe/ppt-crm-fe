import React, { useState, useEffect } from 'react'
import { ValidationUtils, ValidationResult } from '@/utils/validation'

interface ValidatedInputProps {
  type: 'email' | 'phone' | 'optionalEmail' | 'optionalPhone' | 'text'
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean, error?: string) => void
  placeholder?: string
  label?: string
  className?: string
  required?: boolean
  disabled?: boolean
  autoFormat?: boolean // Auto-format phone numbers
  showNetwork?: boolean // Show network provider for phone numbers
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  type,
  value,
  onChange,
  onValidationChange,
  placeholder,
  label,
  className = '',
  required = false,
  disabled = false,
  autoFormat = false,
  showNetwork = false
}) => {
  const [error, setError] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(true)
  const [network, setNetwork] = useState<string>('')

  const validateInput = (inputValue: string): ValidationResult => {
    if (!required && (!inputValue || inputValue.trim().length === 0)) {
      return { isValid: true }
    }

    switch (type) {
      case 'email':
        return ValidationUtils.validateEmail(inputValue)
      case 'phone':
        return ValidationUtils.validatePhone(inputValue)
      case 'optionalEmail':
        return ValidationUtils.validateOptionalEmail(inputValue)
      case 'optionalPhone':
        return ValidationUtils.validateOptionalPhone(inputValue)
      default:
        return { isValid: true }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Auto-format phone numbers
    if (autoFormat && (type === 'phone' || type === 'optionalPhone')) {
      newValue = ValidationUtils.normalizePhone(newValue)
    }

    // Auto-format emails
    if (type === 'email' || type === 'optionalEmail') {
      newValue = ValidationUtils.normalizeEmail(newValue)
    }

    onChange(newValue)

    // Validate and update state
    const validation = validateInput(newValue)
    setIsValid(validation.isValid)
    setError(validation.error || '')

    // Update network for phone numbers
    if (showNetwork && (type === 'phone' || type === 'optionalPhone') && validation.isValid) {
      setNetwork(ValidationUtils.getPhoneNetwork(newValue))
    } else {
      setNetwork('')
    }

    // Notify parent component
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.error)
    }
  }

  useEffect(() => {
    // Initial validation
    const validation = validateInput(value)
    setIsValid(validation.isValid)
    setError(validation.error || '')

    if (showNetwork && (type === 'phone' || type === 'optionalPhone') && validation.isValid) {
      setNetwork(ValidationUtils.getPhoneNetwork(value))
    }

    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.error)
    }
  }, [value, type, required])

  const getInputType = () => {
    if (type === 'email' || type === 'optionalEmail') return 'email'
    if (type === 'phone' || type === 'optionalPhone') return 'tel'
    return 'text'
  }

  const getPlaceholder = () => {
    if (placeholder) return placeholder

    switch (type) {
      case 'email':
      case 'optionalEmail':
        return 'john.doe@example.com'
      case 'phone':
      case 'optionalPhone':
        return '+2348012345678'
      default:
        return ''
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={getInputType()}
          value={value}
          onChange={handleChange}
          placeholder={getPlaceholder()}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${isValid
              ? 'border-gray-300 focus:border-blue-500'
              : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
        />

        {/* Validation icon */}
        {value && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isValid ? (
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </p>
      )}

      {/* Network provider for phone numbers */}
      {network && showNetwork && (
        <p className="mt-1 text-sm text-gray-500 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {network} Network
        </p>
      )}
    </div>
  )
}

export default ValidatedInput