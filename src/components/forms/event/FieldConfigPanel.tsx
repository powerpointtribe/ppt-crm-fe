import { useState } from 'react'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  EnhancedCustomField,
  FormSection,
  getFieldTypeConfig,
} from '@/types/registration-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ValidationRulesEditor from './ValidationRulesEditor'
import ConditionalLogicEditor from './ConditionalLogicEditor'
import { cn } from '@/utils/cn'

interface FieldConfigPanelProps {
  field: EnhancedCustomField
  allFields: EnhancedCustomField[]
  sections: FormSection[]
  onUpdate: (field: EnhancedCustomField) => void
  onClose: () => void
}

type TabId = 'general' | 'validation' | 'conditional'

export default function FieldConfigPanel({
  field,
  allFields,
  sections,
  onUpdate,
  onClose,
}: FieldConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const config = getFieldTypeConfig(field.type)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'validation', label: 'Validation' },
    { id: 'conditional', label: 'Conditional' },
  ]

  const handleFieldChange = (updates: Partial<EnhancedCustomField>) => {
    onUpdate({ ...field, ...updates })
  }

  const handleAddOption = () => {
    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
    handleFieldChange({ options: newOptions })
  }

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...(field.options || [])]
    newOptions[index] = value
    handleFieldChange({ options: newOptions })
  }

  const handleDeleteOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || []
    handleFieldChange({ options: newOptions })
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Configure Field</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label *
                  </label>
                  <Input
                    value={field.label}
                    onChange={(e) => handleFieldChange({ label: e.target.value })}
                    placeholder="Field label"
                  />
                </div>

                {/* Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placeholder
                  </label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => handleFieldChange({ placeholder: e.target.value })}
                    placeholder="Placeholder text"
                  />
                </div>

                {/* Help Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Help Text
                  </label>
                  <Input
                    value={field.helpText || ''}
                    onChange={(e) => handleFieldChange({ helpText: e.target.value })}
                    placeholder="Additional instructions"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Displayed below the field to guide users
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={field.description || ''}
                    onChange={(e) => handleFieldChange({ description: e.target.value })}
                    placeholder="Detailed description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Required */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="fieldRequired"
                    checked={field.required}
                    onChange={(e) => handleFieldChange({ required: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="fieldRequired" className="ml-2 text-sm text-gray-700">
                    This field is required
                  </label>
                </div>

                {/* Section (if multi-section layout) */}
                {sections.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <select
                      value={field.sectionId || ''}
                      onChange={(e) => handleFieldChange({ sectionId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">No section</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Options (for select, radio, multi-checkbox) */}
                {config?.hasOptions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {(field.options || []).map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <Input
                            value={option}
                            onChange={(e) => handleUpdateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteOption(index)}
                            className="!p-2"
                            disabled={(field.options?.length || 0) <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddOption}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'validation' && (
              <ValidationRulesEditor
                fieldType={field.type}
                validation={field.validation}
                onChange={(validation) => handleFieldChange({ validation })}
              />
            )}

            {activeTab === 'conditional' && (
              <ConditionalLogicEditor
                fieldId={field.id}
                conditionalLogic={field.conditionalLogic}
                allFields={allFields}
                onChange={(conditionalLogic) => handleFieldChange({ conditionalLogic })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <Button type="button" onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </div>
  )
}
