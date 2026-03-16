import { useState } from 'react'
import { Layers, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  EnhancedCustomField,
  FormSection,
  FormHeader,
  TermsAndConditions,
  CustomFieldType,
  createDefaultField,
} from '@/types/registration-form'
import { cn } from '@/utils/cn'
import FieldTypeSelector from './FieldTypeSelector'
import SortableFieldList from './SortableFieldList'
import FieldConfigPanel from './FieldConfigPanel'
import SectionManager from './SectionManager'
import FormPreviewPanel from './FormPreviewPanel'

interface FormBuilderStepProps {
  customFields: EnhancedCustomField[]
  formSections: FormSection[]
  eventTitle?: string
  formHeader?: FormHeader
  termsAndConditions?: TermsAndConditions
  onCustomFieldsChange: (fields: EnhancedCustomField[]) => void
  onFormSectionsChange: (sections: FormSection[]) => void
}

type ActivePanel = 'fields' | 'sections'

export default function FormBuilderStep({
  customFields,
  formSections,
  eventTitle,
  formHeader,
  termsAndConditions,
  onCustomFieldsChange,
  onFormSectionsChange,
}: FormBuilderStepProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('fields')
  const [editingField, setEditingField] = useState<EnhancedCustomField | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  const handleAddField = (type: CustomFieldType) => {
    const newField = createDefaultField(type, customFields.length)
    onCustomFieldsChange([...customFields, newField])
    setEditingField(newField)
  }

  const handleUpdateField = (updatedField: EnhancedCustomField) => {
    onCustomFieldsChange(
      customFields.map((f) => (f.id === updatedField.id ? updatedField : f))
    )
    setEditingField(updatedField)
  }

  const handleDeleteField = (fieldId: string) => {
    onCustomFieldsChange(
      customFields
        .filter((f) => f.id !== fieldId)
        .map((f, index) => ({ ...f, order: index }))
    )
    if (editingField?.id === fieldId) {
      setEditingField(null)
    }
  }

  const handleDuplicateField = (field: EnhancedCustomField) => {
    const duplicatedField: EnhancedCustomField = {
      ...field,
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: `${field.label} (Copy)`,
      order: customFields.length,
    }
    onCustomFieldsChange([...customFields, duplicatedField])
  }

  const handleReorderFields = (reorderedFields: EnhancedCustomField[]) => {
    onCustomFieldsChange(reorderedFields)
  }

  const panels: { id: ActivePanel; label: string; icon: React.ElementType }[] = [
    { id: 'fields', label: 'Fields', icon: Layers },
    { id: 'sections', label: 'Sections', icon: Layers },
  ]

  return (
    <div className="space-y-4">
      {/* Form Builder Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary-600" />
            Form Builder
          </h3>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              showPreview
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            )}
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
        </div>

        <div className={cn('grid', showPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>
          {/* Left Panel - Builder */}
          <div className="border-r border-gray-100">
            {/* Panel Tabs */}
            <div className="flex bg-gray-50 border-b border-gray-100">
              {panels.map((panel) => {
                const Icon = panel.icon
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActivePanel(panel.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                      activePanel === panel.id
                        ? 'text-primary-600 bg-white border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {panel.label}
                  </button>
                )
              })}
            </div>

            {/* Panel Content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activePanel === 'fields' && (
                    <div className="space-y-4">
                      <FieldTypeSelector onSelect={handleAddField} />
                      <SortableFieldList
                        fields={customFields.sort((a, b) => a.order - b.order)}
                        onReorder={handleReorderFields}
                        onEdit={setEditingField}
                        onDelete={handleDeleteField}
                        onDuplicate={handleDuplicateField}
                        selectedFieldId={editingField?.id}
                      />
                    </div>
                  )}

                  {activePanel === 'sections' && (
                    <SectionManager
                      sections={formSections}
                      onChange={onFormSectionsChange}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel - Preview */}
          {showPreview && (
            <div className="bg-gray-50 p-4">
              <FormPreviewPanel
                fields={customFields}
                sections={formSections}
                formHeader={formHeader}
                termsAndConditions={termsAndConditions}
                eventTitle={eventTitle}
              />
            </div>
          )}
        </div>
      </div>

      {/* Field Config Slide-out Panel */}
      <AnimatePresence>
        {editingField && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setEditingField(null)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <FieldConfigPanel
                field={editingField}
                allFields={customFields}
                sections={formSections}
                onUpdate={handleUpdateField}
                onClose={() => setEditingField(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
