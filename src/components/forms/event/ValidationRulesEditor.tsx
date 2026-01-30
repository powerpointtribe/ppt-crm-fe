import { FieldValidation, CustomFieldType } from '@/types/registration-form'
import Input from '@/components/ui/Input'

interface ValidationRulesEditorProps {
  fieldType: CustomFieldType
  validation: FieldValidation | undefined
  onChange: (validation: FieldValidation) => void
}

export default function ValidationRulesEditor({
  fieldType,
  validation = {},
  onChange,
}: ValidationRulesEditorProps) {
  const handleChange = (key: keyof FieldValidation, value: string | number | undefined) => {
    onChange({
      ...validation,
      [key]: value === '' ? undefined : value,
    })
  }

  // Determine which validation options to show based on field type
  const showTextValidation = ['text', 'textarea', 'email', 'phone'].includes(fieldType)
  const showNumberValidation = ['number', 'rating'].includes(fieldType)
  const showPatternValidation = ['text', 'phone'].includes(fieldType)

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Validation Rules</h4>

      {showTextValidation && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Min Length
            </label>
            <Input
              type="number"
              value={validation.minLength ?? ''}
              onChange={(e) => handleChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="0"
              min={0}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Max Length
            </label>
            <Input
              type="number"
              value={validation.maxLength ?? ''}
              onChange={(e) => handleChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="255"
              min={1}
            />
          </div>
        </div>
      )}

      {showNumberValidation && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Minimum Value
            </label>
            <Input
              type="number"
              value={validation.min ?? ''}
              onChange={(e) => handleChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Maximum Value
            </label>
            <Input
              type="number"
              value={validation.max ?? ''}
              onChange={(e) => handleChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="100"
            />
          </div>
        </div>
      )}

      {showPatternValidation && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Regex Pattern
            </label>
            <Input
              type="text"
              value={validation.pattern ?? ''}
              onChange={(e) => handleChange('pattern', e.target.value)}
              placeholder="e.g., ^[A-Za-z]+$"
            />
            <p className="mt-1 text-xs text-gray-400">
              Regular expression for custom validation
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Pattern Error Message
            </label>
            <Input
              type="text"
              value={validation.patternMessage ?? ''}
              onChange={(e) => handleChange('patternMessage', e.target.value)}
              placeholder="Please enter a valid value"
            />
          </div>
        </>
      )}

      {!showTextValidation && !showNumberValidation && !showPatternValidation && (
        <p className="text-sm text-gray-500 italic">
          No validation rules available for this field type.
        </p>
      )}
    </div>
  )
}
