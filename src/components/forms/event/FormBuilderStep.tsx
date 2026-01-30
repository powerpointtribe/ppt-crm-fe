import { useState } from 'react'
import { Settings, Layers, Eye, EyeOff, Users, Calendar, Link2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  EnhancedCustomField,
  FormSection,
  FormHeader,
  SuccessMessage,
  TermsAndConditions,
  FormLayout,
  FormStatus,
  CustomFieldType,
  createDefaultField,
} from '@/types/registration-form'
import { cn } from '@/utils/cn'
import FieldTypeSelector from './FieldTypeSelector'
import SortableFieldList from './SortableFieldList'
import FieldConfigPanel from './FieldConfigPanel'
import SectionManager from './SectionManager'
import FormPreviewPanel from './FormPreviewPanel'
import FormSettingsPanel from './FormSettingsPanel'

interface FormBuilderStepProps {
  // Basic registration settings
  isOpen: boolean
  maxAttendees?: number
  deadline?: string
  requireApproval: boolean
  allowWaitlist: boolean
  registrationSlug?: string
  // Enhanced settings
  customFields: EnhancedCustomField[]
  formLayout: FormLayout
  formSections: FormSection[]
  qrCodeEnabled: boolean
  formHeader?: FormHeader
  successMessage?: SuccessMessage
  termsAndConditions?: TermsAndConditions
  formStatus: FormStatus
  eventTitle?: string
  // Callbacks
  onIsOpenChange: (value: boolean) => void
  onMaxAttendeesChange: (value: number | undefined) => void
  onDeadlineChange: (value: string) => void
  onRequireApprovalChange: (value: boolean) => void
  onAllowWaitlistChange: (value: boolean) => void
  onRegistrationSlugChange: (value: string) => void
  onCustomFieldsChange: (fields: EnhancedCustomField[]) => void
  onFormLayoutChange: (layout: FormLayout) => void
  onFormSectionsChange: (sections: FormSection[]) => void
  onQrCodeEnabledChange: (enabled: boolean) => void
  onFormHeaderChange: (header: FormHeader) => void
  onSuccessMessageChange: (message: SuccessMessage) => void
  onTermsAndConditionsChange: (terms: TermsAndConditions) => void
  onFormStatusChange: (status: FormStatus) => void
}

type ActivePanel = 'fields' | 'sections' | 'settings'

export default function FormBuilderStep({
  isOpen,
  maxAttendees,
  deadline,
  requireApproval,
  allowWaitlist,
  registrationSlug,
  customFields,
  formLayout,
  formSections,
  qrCodeEnabled,
  formHeader,
  successMessage,
  termsAndConditions,
  formStatus,
  eventTitle,
  onIsOpenChange,
  onMaxAttendeesChange,
  onDeadlineChange,
  onRequireApprovalChange,
  onAllowWaitlistChange,
  onRegistrationSlugChange,
  onCustomFieldsChange,
  onFormLayoutChange,
  onFormSectionsChange,
  onQrCodeEnabledChange,
  onFormHeaderChange,
  onSuccessMessageChange,
  onTermsAndConditionsChange,
  onFormStatusChange,
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
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Compact toggle switch component
  const ToggleSwitch = ({ checked, onChange, label, description }: {
    checked: boolean
    onChange: (value: boolean) => void
    label: string
    description?: string
  }) => (
    <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-primary-600" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </label>
  )

  return (
    <div className="space-y-4">
      {/* Compact Registration Settings Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary-600" />
            Registration Settings
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {/* Toggle Switches Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ToggleSwitch
              checked={isOpen}
              onChange={onIsOpenChange}
              label="Open"
              description="Accept registrations"
            />
            <ToggleSwitch
              checked={requireApproval}
              onChange={onRequireApprovalChange}
              label="Approval"
              description="Review before confirm"
            />
            <ToggleSwitch
              checked={allowWaitlist}
              onChange={onAllowWaitlistChange}
              label="Waitlist"
              description="When capacity full"
            />
          </div>

          {/* Compact Input Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Users className="inline h-3 w-3 mr-1" />
                Max Attendees
              </label>
              <input
                type="number"
                value={maxAttendees || ''}
                onChange={(e) => onMaxAttendeesChange(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Unlimited"
                min={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                Deadline
              </label>
              <input
                type="date"
                value={deadline || ''}
                onChange={(e) => onDeadlineChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Link2 className="inline h-3 w-3 mr-1" />
                URL Slug
              </label>
              <input
                type="text"
                value={registrationSlug || ''}
                onChange={(e) => onRegistrationSlugChange(e.target.value)}
                placeholder="my-event"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

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

                  {activePanel === 'settings' && (
                    <FormSettingsPanel
                      formLayout={formLayout}
                      formStatus={formStatus}
                      qrCodeEnabled={qrCodeEnabled}
                      formHeader={formHeader}
                      successMessage={successMessage}
                      termsAndConditions={termsAndConditions}
                      registrationSlug={registrationSlug}
                      onFormLayoutChange={onFormLayoutChange}
                      onFormStatusChange={onFormStatusChange}
                      onQrCodeEnabledChange={onQrCodeEnabledChange}
                      onFormHeaderChange={onFormHeaderChange}
                      onSuccessMessageChange={onSuccessMessageChange}
                      onTermsAndConditionsChange={onTermsAndConditionsChange}
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
