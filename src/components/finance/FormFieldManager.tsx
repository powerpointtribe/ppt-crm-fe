import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Save,
  X,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { financeService } from '@/services/finance'
import { useAuth } from '@/contexts/AuthContext-unified'
import { showToast } from '@/utils/toast'
import type {
  FormFieldConfig,
  CreateFormFieldConfigDto,
  FormFieldType,
} from '@/types/finance'

interface FormFieldManagerProps {
  formType: string
  onClose?: () => void
}

const fieldTypeOptions: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
]

const gridSpanOptions = [
  { value: 4, label: '1/3 Width' },
  { value: 6, label: '1/2 Width' },
  { value: 12, label: 'Full Width' },
]

export default function FormFieldManager({
  formType,
  onClose,
}: FormFieldManagerProps) {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('finance:manage-form-fields')

  const [fields, setFields] = useState<FormFieldConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  // New field form state
  const [newField, setNewField] = useState<CreateFormFieldConfigDto>({
    formType,
    fieldKey: '',
    label: '',
    placeholder: '',
    helpText: '',
    fieldType: 'text',
    step: 1,
    gridSpan: 12,
    validation: { required: false },
  })

  useEffect(() => {
    loadFields()
  }, [formType])

  const loadFields = async () => {
    try {
      setLoading(true)
      const data = await financeService.getFormFields(formType, true)
      setFields(data)
    } catch (err) {
      console.error('Failed to load form fields:', err)
      showToast.error('Failed to load form fields')
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (step: number, newOrder: FormFieldConfig[]) => {
    // Update local state immediately
    const otherFields = fields.filter((f) => f.step !== step)
    const reorderedFields = newOrder.map((f, index) => ({
      ...f,
      sortOrder: index,
    }))
    setFields([...otherFields, ...reorderedFields].sort((a, b) => {
      if (a.step !== b.step) return a.step - b.step
      return a.sortOrder - b.sortOrder
    }))

    // Save to backend
    try {
      await financeService.bulkUpdateSortOrder({
        items: reorderedFields.map((f, index) => ({
          id: f._id,
          sortOrder: index,
        })),
      })
    } catch (err) {
      console.error('Failed to update sort order:', err)
      showToast.error('Failed to save field order')
      loadFields() // Reload on error
    }
  }

  const handleAddField = async () => {
    if (!newField.fieldKey || !newField.label) {
      showToast.error('Field key and label are required')
      return
    }

    try {
      setSaving(true)
      await financeService.createFormField(newField)
      showToast.success('Field added successfully')
      setShowAddModal(false)
      setNewField({
        formType,
        fieldKey: '',
        label: '',
        placeholder: '',
        helpText: '',
        fieldType: 'text',
        step: 1,
        gridSpan: 12,
        validation: { required: false },
      })
      loadFields()
    } catch (err: any) {
      console.error('Failed to add field:', err)
      showToast.error(err.response?.data?.message || 'Failed to add field')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateField = async () => {
    if (!editingField) return

    try {
      setSaving(true)
      await financeService.updateFormField(editingField._id, {
        label: editingField.label,
        placeholder: editingField.placeholder,
        helpText: editingField.helpText,
        gridSpan: editingField.gridSpan,
        validation: editingField.validation,
      })
      showToast.success('Field updated successfully')
      setEditingField(null)
      loadFields()
    } catch (err: any) {
      console.error('Failed to update field:', err)
      showToast.error(err.response?.data?.message || 'Failed to update field')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (field: FormFieldConfig) => {
    try {
      await financeService.toggleFormFieldActive(field._id)
      showToast.success(
        field.isActive ? 'Field hidden from form' : 'Field visible on form'
      )
      loadFields()
    } catch (err: any) {
      console.error('Failed to toggle field:', err)
      showToast.error(err.response?.data?.message || 'Failed to toggle field')
    }
  }

  const handleDeleteField = async (field: FormFieldConfig) => {
    if (field.isSystemField) {
      showToast.error('Cannot delete system fields')
      return
    }

    if (!confirm(`Are you sure you want to delete "${field.label}"?`)) {
      return
    }

    try {
      await financeService.deleteFormField(field._id)
      showToast.success('Field deleted successfully')
      loadFields()
    } catch (err: any) {
      console.error('Failed to delete field:', err)
      showToast.error(err.response?.data?.message || 'Failed to delete field')
    }
  }

  const handleInitialize = async () => {
    console.log('Initialize button clicked')
    try {
      setSaving(true)
      console.log('Calling initializeFormFields API...')
      const result = await financeService.initializeFormFields(formType)
      console.log('Initialize result:', result)
      if (result.created) {
        showToast.success(`Created ${result.count} default fields`)
      } else {
        showToast.info(`Fields already initialized (${result.count} fields exist)`)
      }
      loadFields()
    } catch (err) {
      console.error('Failed to initialize fields:', err)
      showToast.error('Failed to initialize fields')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('This will delete ALL existing form fields and create fresh defaults. Are you sure?')) {
      return
    }
    try {
      setSaving(true)
      const result = await financeService.resetFormFields(formType)
      showToast.success(`Reset complete - created ${result.count} default fields`)
      loadFields()
    } catch (err) {
      console.error('Failed to reset fields:', err)
      showToast.error('Failed to reset fields')
    } finally {
      setSaving(false)
    }
  }

  const getStepFields = (step: number) =>
    fields.filter((f) => f.step === step).sort((a, b) => a.sortOrder - b.sortOrder)

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </Card>
    )
  }

  if (fields.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Form Fields Configured
          </h3>
          <p className="text-gray-500 mb-4">
            Initialize default fields to get started, or reset if fields exist with incorrect data
          </p>
          <div className="flex justify-center gap-3">
            <Button type="button" onClick={handleInitialize} disabled={saving}>
              {saving ? 'Working...' : 'Initialize Default Fields'}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset & Reinitialize
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Form Field Configuration
          </h2>
          <p className="text-sm text-gray-500">
            Drag to reorder, click to edit field labels and settings
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Field
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Step 1 Fields */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              Step 1: Request Details
            </span>
            <span className="text-sm text-gray-500">
              ({getStepFields(1).length} fields)
            </span>
          </div>
          {expandedStep === 1 ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedStep === 1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 space-y-2">
                <Reorder.Group
                  axis="y"
                  values={getStepFields(1)}
                  onReorder={(newOrder) => handleReorder(1, newOrder)}
                  className="space-y-2"
                >
                  {getStepFields(1).map((field) => (
                    <FieldItem
                      key={field._id}
                      field={field}
                      canManage={canManage}
                      onEdit={() => setEditingField(field)}
                      onToggle={() => handleToggleActive(field)}
                      onDelete={() => handleDeleteField(field)}
                    />
                  ))}
                </Reorder.Group>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Step 2 Fields */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              Step 2: Cost & Payment
            </span>
            <span className="text-sm text-gray-500">
              ({getStepFields(2).length} fields)
            </span>
          </div>
          {expandedStep === 2 ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedStep === 2 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 space-y-2">
                <Reorder.Group
                  axis="y"
                  values={getStepFields(2)}
                  onReorder={(newOrder) => handleReorder(2, newOrder)}
                  className="space-y-2"
                >
                  {getStepFields(2).map((field) => (
                    <FieldItem
                      key={field._id}
                      field={field}
                      canManage={canManage}
                      onEdit={() => setEditingField(field)}
                      onToggle={() => handleToggleActive(field)}
                      onDelete={() => handleDeleteField(field)}
                    />
                  ))}
                </Reorder.Group>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Add Field Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Field"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field Key <span className="text-red-500">*</span>
              </label>
              <Input
                value={newField.fieldKey}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    fieldKey: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                  })
                }
                placeholder="e.g., custom_field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier (no spaces)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Label <span className="text-red-500">*</span>
              </label>
              <Input
                value={newField.label}
                onChange={(e) =>
                  setNewField({ ...newField, label: e.target.value })
                }
                placeholder="e.g., Custom Field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field Type
              </label>
              <select
                value={newField.fieldType}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    fieldType: e.target.value as FormFieldType,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600"
              >
                {fieldTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Step
              </label>
              <select
                value={newField.step}
                onChange={(e) =>
                  setNewField({ ...newField, step: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600"
              >
                <option value={1}>Step 1: Request Details</option>
                <option value={2}>Step 2: Cost & Payment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width
              </label>
              <select
                value={newField.gridSpan}
                onChange={(e) =>
                  setNewField({ ...newField, gridSpan: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600"
              >
                {gridSpanOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newField.validation?.required}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      validation: {
                        ...newField.validation,
                        required: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Required field
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placeholder
            </label>
            <Input
              value={newField.placeholder}
              onChange={(e) =>
                setNewField({ ...newField, placeholder: e.target.value })
              }
              placeholder="Placeholder text..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Help Text
            </label>
            <Input
              value={newField.helpText}
              onChange={(e) =>
                setNewField({ ...newField, helpText: e.target.value })
              }
              placeholder="Help text displayed below field..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddField} disabled={saving}>
              {saving ? 'Adding...' : 'Add Field'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Field Modal */}
      <Modal
        isOpen={!!editingField}
        onClose={() => setEditingField(null)}
        title="Edit Field"
      >
        {editingField && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field Key
              </label>
              <Input value={editingField.fieldKey} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500 mt-1">
                Field key cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Label <span className="text-red-500">*</span>
              </label>
              <Input
                value={editingField.label}
                onChange={(e) =>
                  setEditingField({ ...editingField, label: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Placeholder
              </label>
              <Input
                value={editingField.placeholder || ''}
                onChange={(e) =>
                  setEditingField({
                    ...editingField,
                    placeholder: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Help Text
              </label>
              <Input
                value={editingField.helpText || ''}
                onChange={(e) =>
                  setEditingField({ ...editingField, helpText: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width
              </label>
              <select
                value={editingField.gridSpan}
                onChange={(e) =>
                  setEditingField({
                    ...editingField,
                    gridSpan: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600"
              >
                {gridSpanOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {!editingField.isSystemField && (
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingField.validation?.required}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        validation: {
                          ...editingField.validation,
                          required: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Required field
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={() => setEditingField(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateField} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// Field Item Component
function FieldItem({
  field,
  canManage,
  onEdit,
  onToggle,
  onDelete,
}: {
  field: FormFieldConfig
  canManage: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <Reorder.Item
      value={field}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border rounded-lg ${
        field.isActive
          ? 'border-gray-200 dark:border-gray-700'
          : 'border-gray-200 dark:border-gray-700 opacity-50'
      }`}
    >
      {canManage && (
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {field.label}
          </span>
          {field.isSystemField && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
              System
            </span>
          )}
          {field.validation?.required && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{field.fieldType}</span>
          <span>•</span>
          <span>{field.fieldKey}</span>
          <span>•</span>
          <span>
            {field.gridSpan === 12
              ? 'Full'
              : field.gridSpan === 6
              ? '1/2'
              : '1/3'}
          </span>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            title={field.isActive ? 'Hide field' : 'Show field'}
          >
            {field.isActive ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-primary rounded"
            title="Edit field"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!field.isSystemField && (
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded"
              title="Delete field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </Reorder.Item>
  )
}
