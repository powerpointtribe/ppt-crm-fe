import { useState } from 'react'
import { Eye, EyeOff, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  EnhancedCustomField,
  FormSection,
  FormHeader,
  TermsAndConditions,
  evaluateConditionalLogic,
} from '@/types/registration-form'
import { cn } from '@/utils/cn'

interface FormPreviewPanelProps {
  fields: EnhancedCustomField[]
  sections: FormSection[]
  formHeader?: FormHeader
  termsAndConditions?: TermsAndConditions
  eventTitle?: string
}

export default function FormPreviewPanel({
  fields,
  sections,
  formHeader,
  termsAndConditions,
  eventTitle = 'Event Title',
}: FormPreviewPanelProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const getVisibleFields = () => {
    return fields.filter((field) => evaluateConditionalLogic(field, formValues, fields))
  }

  const getFieldsInSection = (sectionId: string | undefined) => {
    return getVisibleFields()
      .filter((f) => f.sectionId === sectionId)
      .sort((a, b) => a.order - b.order)
  }

  const renderFieldPreview = (field: EnhancedCustomField) => {
    const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || field.label}
            rows={3}
            className={commonClasses}
            value={formValues[field.id] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
          />
        )
      case 'select':
        return (
          <select
            className={commonClasses}
            value={formValues[field.id] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
          >
            <option value="">Select an option</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={formValues[field.id] === opt}
                  onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formValues[field.id]}
              onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.checked })}
              className="h-4 w-4 text-primary-600 rounded"
            />
            <span className="text-sm text-gray-700">{field.helpText || 'Yes'}</span>
          </label>
        )
      case 'multi-checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(formValues[field.id] || []).includes(opt)}
                  onChange={(e) => {
                    const current = formValues[field.id] || []
                    const newValue = e.target.checked
                      ? [...current, opt]
                      : current.filter((v: string) => v !== opt)
                    setFormValues({ ...formValues, [field.id]: newValue })
                  }}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormValues({ ...formValues, [field.id]: star })}
                className={cn(
                  'text-2xl transition-colors',
                  (formValues[field.id] || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                )}
              >
                ★
              </button>
            ))}
          </div>
        )
      case 'date':
        return (
          <input
            type="date"
            className={commonClasses}
            value={formValues[field.id] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
          />
        )
      case 'time':
        return (
          <input
            type="time"
            className={commonClasses}
            value={formValues[field.id] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder || field.label}
            className={commonClasses}
            value={formValues[field.id] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )
      default:
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder || field.label}
            className={commonClasses}
            value={formValues[field.id] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
          />
        )
    }
  }

  const renderFields = (fieldsToRender: EnhancedCustomField[]) => {
    return fieldsToRender.map((field) => (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-1"
      >
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderFieldPreview(field)}
        {field.helpText && (
          <p className="text-xs text-gray-500">{field.helpText}</p>
        )}
      </motion.div>
    ))
  }

  const visibleFields = getVisibleFields()
  const unassignedFields = getFieldsInSection(undefined)

  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Live Preview</span>
          <span className="text-xs text-gray-400">({visibleFields.length} fields)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={cn(
                'p-1.5',
                viewMode === 'desktop' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
              )}
            >
              <Monitor className="h-4 w-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={cn(
                'p-1.5 border-l',
                viewMode === 'mobile' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
              )}
            >
              <Smartphone className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            {isCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className={cn(
              'mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
              viewMode === 'mobile' ? 'max-w-sm' : 'max-w-full'
            )}
          >
            {/* Form Header */}
            <div className="p-4 border-b bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              {formHeader?.logoUrl && (
                <img
                  src={formHeader.logoUrl}
                  alt="Logo"
                  className="h-12 w-auto mb-3"
                />
              )}
              <h2 className="text-lg font-bold">
                {formHeader?.title || eventTitle}
              </h2>
              {formHeader?.description && (
                <p className="text-sm mt-1 opacity-90">{formHeader.description}</p>
              )}
            </div>

            {/* Form Fields */}
            <div className="p-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Add fields to see them here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Render sections */}
                  {sections.length > 0 ? (
                    sections.map((section) => {
                      const sectionFields = getFieldsInSection(section.id)
                      if (sectionFields.length === 0) return null

                      return (
                        <div key={section.id} className="space-y-4">
                          <div className="border-b pb-2">
                            <h3 className="font-medium text-gray-900">{section.title}</h3>
                            {section.description && (
                              <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                            )}
                          </div>
                          <AnimatePresence mode="popLayout">
                            {renderFields(sectionFields)}
                          </AnimatePresence>
                        </div>
                      )
                    })
                  ) : null}

                  {/* Unassigned fields */}
                  {unassignedFields.length > 0 && (
                    <AnimatePresence mode="popLayout">
                      {renderFields(unassignedFields)}
                    </AnimatePresence>
                  )}

                  {/* Terms and Conditions */}
                  {termsAndConditions?.enabled && (
                    <div className="pt-4 border-t">
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 mt-0.5 text-primary-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {termsAndConditions.text || 'I agree to the terms and conditions'}
                          {termsAndConditions.linkUrl && (
                            <a
                              href={termsAndConditions.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline ml-1"
                            >
                              Read more
                            </a>
                          )}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Register Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
