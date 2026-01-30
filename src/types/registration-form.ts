// Registration Form Types for Enhanced Event Registration System

// Field types supported by the form builder
export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'rating'
  | 'multi-checkbox'

// Validation rules for custom fields
export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  patternMessage?: string
}

// Conditional logic operators
export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'

// Single conditional rule
export interface ConditionalRule {
  fieldId: string
  operator: ConditionalOperator
  value?: string
}

// Conditional logic configuration
export interface ConditionalLogic {
  enabled: boolean
  action: 'show' | 'hide'
  rules: ConditionalRule[]
  logicType: 'all' | 'any'
}

// Enhanced custom field definition
export interface EnhancedCustomField {
  id: string
  label: string
  type: CustomFieldType
  required: boolean
  options?: string[]
  placeholder?: string
  helpText?: string
  description?: string
  sectionId?: string
  order: number
  validation?: FieldValidation
  conditionalLogic?: ConditionalLogic
}

// Form section for multi-section forms
export interface FormSection {
  id: string
  title: string
  description?: string
  order: number
  collapsible?: boolean
  defaultExpanded?: boolean
}

// Form header configuration
export interface FormHeader {
  title?: string
  description?: string
  logoUrl?: string
}

// Success message configuration
export interface SuccessMessage {
  title?: string
  message?: string
  showCheckInQR?: boolean
}

// Terms and conditions configuration
export interface TermsAndConditions {
  enabled: boolean
  text?: string
  linkUrl?: string
}

// Form layout type
export type FormLayout = 'single-page' | 'multi-section'

// Form status
export type FormStatus = 'draft' | 'live'

// Enhanced registration settings
export interface EnhancedRegistrationSettings {
  isOpen: boolean
  maxAttendees?: number
  deadline?: string
  requireApproval: boolean
  allowWaitlist: boolean
  customFields: EnhancedCustomField[]
  formLayout?: FormLayout
  formSections?: FormSection[]
  qrCodeEnabled?: boolean
  formHeader?: FormHeader
  successMessage?: SuccessMessage
  termsAndConditions?: TermsAndConditions
  formStatus?: FormStatus
}

// Field type configuration for the builder
export interface FieldTypeConfig {
  type: CustomFieldType
  label: string
  icon: string
  description: string
  hasOptions: boolean
  hasValidation: boolean
  defaultValidation?: Partial<FieldValidation>
}

// Field types available in the form builder
export const FIELD_TYPE_CONFIGS: FieldTypeConfig[] = [
  {
    type: 'text',
    label: 'Text',
    icon: 'Type',
    description: 'Single line text input',
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { maxLength: 255 },
  },
  {
    type: 'textarea',
    label: 'Long Text',
    icon: 'AlignLeft',
    description: 'Multi-line text area',
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { maxLength: 1000 },
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'Mail',
    description: 'Email address with validation',
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', patternMessage: 'Please enter a valid email address' },
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: 'Phone',
    description: 'Phone number input',
    hasOptions: false,
    hasValidation: true,
  },
  {
    type: 'number',
    label: 'Number',
    icon: 'Hash',
    description: 'Numeric input with min/max',
    hasOptions: false,
    hasValidation: true,
  },
  {
    type: 'date',
    label: 'Date',
    icon: 'Calendar',
    description: 'Date picker',
    hasOptions: false,
    hasValidation: false,
  },
  {
    type: 'time',
    label: 'Time',
    icon: 'Clock',
    description: 'Time picker',
    hasOptions: false,
    hasValidation: false,
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: 'ChevronDown',
    description: 'Single select dropdown',
    hasOptions: true,
    hasValidation: false,
  },
  {
    type: 'radio',
    label: 'Radio',
    icon: 'Circle',
    description: 'Single choice radio buttons',
    hasOptions: true,
    hasValidation: false,
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: 'CheckSquare',
    description: 'Single yes/no checkbox',
    hasOptions: false,
    hasValidation: false,
  },
  {
    type: 'multi-checkbox',
    label: 'Multi-Select',
    icon: 'ListChecks',
    description: 'Multiple checkbox selection',
    hasOptions: true,
    hasValidation: false,
  },
  {
    type: 'rating',
    label: 'Rating',
    icon: 'Star',
    description: 'Star rating (1-5)',
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { min: 1, max: 5 },
  },
]

// Get field type configuration
export const getFieldTypeConfig = (type: CustomFieldType): FieldTypeConfig | undefined => {
  return FIELD_TYPE_CONFIGS.find((config) => config.type === type)
}

// Create a new custom field with defaults
export const createDefaultField = (type: CustomFieldType, order: number): EnhancedCustomField => {
  const config = getFieldTypeConfig(type)
  return {
    id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    label: config?.label || 'New Field',
    type,
    required: false,
    order,
    options: config?.hasOptions ? ['Option 1', 'Option 2'] : undefined,
    validation: config?.defaultValidation,
    conditionalLogic: {
      enabled: false,
      action: 'show',
      rules: [],
      logicType: 'all',
    },
  }
}

// Create a new form section with defaults
export const createDefaultSection = (order: number): FormSection => {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `Section ${order + 1}`,
    order,
    collapsible: false,
    defaultExpanded: true,
  }
}

// Conditional operator labels
export const CONDITIONAL_OPERATORS: { value: ConditionalOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
]

// Evaluate conditional logic for a field
export const evaluateConditionalLogic = (
  field: EnhancedCustomField,
  formValues: Record<string, any>,
  allFields: EnhancedCustomField[]
): boolean => {
  if (!field.conditionalLogic?.enabled || field.conditionalLogic.rules.length === 0) {
    return true // No conditional logic, always show
  }

  const { action, rules, logicType } = field.conditionalLogic

  const evaluateRule = (rule: ConditionalRule): boolean => {
    const sourceField = allFields.find((f) => f.id === rule.fieldId)
    if (!sourceField) return false

    const value = formValues[rule.fieldId]
    const compareValue = rule.value

    switch (rule.operator) {
      case 'equals':
        return String(value) === String(compareValue)
      case 'not_equals':
        return String(value) !== String(compareValue)
      case 'contains':
        return String(value).toLowerCase().includes(String(compareValue).toLowerCase())
      case 'not_contains':
        return !String(value).toLowerCase().includes(String(compareValue).toLowerCase())
      case 'greater_than':
        return Number(value) > Number(compareValue)
      case 'less_than':
        return Number(value) < Number(compareValue)
      case 'is_empty':
        return !value || String(value).trim() === ''
      case 'is_not_empty':
        return !!value && String(value).trim() !== ''
      default:
        return false
    }
  }

  const results = rules.map(evaluateRule)
  const conditionMet = logicType === 'all' ? results.every(Boolean) : results.some(Boolean)

  // If action is 'show', show when condition is met; if 'hide', hide when condition is met
  return action === 'show' ? conditionMet : !conditionMet
}

// Build Zod schema dynamically from field configuration
export const buildValidationRules = (field: EnhancedCustomField): Record<string, any> => {
  const rules: Record<string, any> = {}

  if (field.required) {
    rules.required = `${field.label} is required`
  }

  if (field.validation) {
    const { minLength, maxLength, min, max, pattern, patternMessage } = field.validation

    if (minLength !== undefined) {
      rules.minLength = {
        value: minLength,
        message: `${field.label} must be at least ${minLength} characters`,
      }
    }

    if (maxLength !== undefined) {
      rules.maxLength = {
        value: maxLength,
        message: `${field.label} must be no more than ${maxLength} characters`,
      }
    }

    if (min !== undefined) {
      rules.min = {
        value: min,
        message: `${field.label} must be at least ${min}`,
      }
    }

    if (max !== undefined) {
      rules.max = {
        value: max,
        message: `${field.label} must be no more than ${max}`,
      }
    }

    if (pattern) {
      rules.pattern = {
        value: new RegExp(pattern),
        message: patternMessage || `${field.label} is invalid`,
      }
    }
  }

  // Email validation
  if (field.type === 'email') {
    rules.pattern = {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    }
  }

  return rules
}
