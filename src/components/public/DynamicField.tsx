import { useFormContext, Controller } from 'react-hook-form'
import { CustomField } from '@/types/event'
import { evaluateConditionalLogic, buildValidationRules } from '@/types/registration-form'
import {
  TextField,
  TextareaField,
  EmailField,
  PhoneField,
  NumberField,
  DateField,
  TimeField,
  SelectField,
  RadioField,
  CheckboxField,
  MultiCheckboxField,
  RatingField,
} from './fields'
import { motion, AnimatePresence } from 'framer-motion'

interface DynamicFieldProps {
  field: CustomField
  allFields: CustomField[]
  namePrefix?: string
}

export default function DynamicField({ field, allFields, namePrefix = 'customFieldResponses' }: DynamicFieldProps) {
  const { register, control, watch, formState: { errors } } = useFormContext()

  // Get all form values for conditional logic evaluation
  const formValues = watch()
  const customFieldValues = formValues[namePrefix] || {}

  // Evaluate conditional logic
  const isVisible = evaluateConditionalLogic(field, customFieldValues, allFields as any)

  // Get validation rules for this field
  const validationRules = buildValidationRules(field as any)

  // Get the field name
  const fieldName = `${namePrefix}.${field.id}`

  // Get error for this field
  const prefixErrors = errors[namePrefix] as Record<string, { message?: string }> | undefined
  const fieldError = prefixErrors?.[field.id]?.message as string | undefined

  // Common props for all fields
  const commonProps = {
    id: field.id,
    label: field.label,
    required: field.required,
    helpText: field.helpText,
    error: fieldError,
  }

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <TextField
            {...commonProps}
            placeholder={field.placeholder}
            {...register(fieldName, validationRules)}
          />
        )

      case 'textarea':
        return (
          <TextareaField
            {...commonProps}
            placeholder={field.placeholder}
            {...register(fieldName, validationRules)}
          />
        )

      case 'email':
        return (
          <EmailField
            {...commonProps}
            placeholder={field.placeholder || 'email@example.com'}
            {...register(fieldName, validationRules)}
          />
        )

      case 'phone':
        return (
          <PhoneField
            {...commonProps}
            placeholder={field.placeholder || '+234...'}
            {...register(fieldName, validationRules)}
          />
        )

      case 'number':
        return (
          <NumberField
            {...commonProps}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            {...register(fieldName, validationRules)}
          />
        )

      case 'date':
        return (
          <DateField
            {...commonProps}
            {...register(fieldName, validationRules)}
          />
        )

      case 'time':
        return (
          <TimeField
            {...commonProps}
            {...register(fieldName, validationRules)}
          />
        )

      case 'select':
        return (
          <SelectField
            {...commonProps}
            options={field.options || []}
            placeholder={field.placeholder || 'Select an option'}
            {...register(fieldName, validationRules)}
          />
        )

      case 'radio':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={validationRules}
            render={({ field: controllerField }) => (
              <RadioField
                {...commonProps}
                name={field.id}
                options={field.options || []}
                value={controllerField.value}
                onChange={controllerField.onChange}
              />
            )}
          />
        )

      case 'checkbox':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={validationRules}
            render={({ field: controllerField }) => (
              <CheckboxField
                {...commonProps}
                description={field.description}
                checked={controllerField.value}
                onChange={controllerField.onChange}
              />
            )}
          />
        )

      case 'multi-checkbox':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={validationRules}
            render={({ field: controllerField }) => (
              <MultiCheckboxField
                {...commonProps}
                options={field.options || []}
                value={controllerField.value || []}
                onChange={controllerField.onChange}
              />
            )}
          />
        )

      case 'rating':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={validationRules}
            render={({ field: controllerField }) => (
              <RatingField
                {...commonProps}
                value={controllerField.value}
                onChange={controllerField.onChange}
                maxRating={field.validation?.max || 5}
              />
            )}
          />
        )

      default:
        return (
          <TextField
            {...commonProps}
            placeholder={field.placeholder}
            {...register(fieldName, validationRules)}
          />
        )
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderField()}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
