import { useState } from 'react'
import { X } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { BulkUpdateData } from '@/utils/bulkOperations'

interface BulkEditField {
  key: string
  label: string
  type: 'text' | 'select' | 'boolean' | 'number' | 'date'
  options?: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
}

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: BulkUpdateData) => void
  fields: BulkEditField[]
  selectedCount: number
  entityName: string
  loading?: boolean
}

export default function BulkEditModal({
  isOpen,
  onClose,
  onSave,
  fields,
  selectedCount,
  entityName,
  loading = false
}: BulkEditModalProps) {
  const [formData, setFormData] = useState<BulkUpdateData>({})
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set())

  const handleFieldToggle = (fieldKey: string) => {
    const newEnabledFields = new Set(enabledFields)
    if (newEnabledFields.has(fieldKey)) {
      newEnabledFields.delete(fieldKey)
      const newFormData = { ...formData }
      delete newFormData[fieldKey]
      setFormData(newFormData)
    } else {
      newEnabledFields.add(fieldKey)
    }
    setEnabledFields(newEnabledFields)
  }

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  const handleSave = () => {
    const dataToSave: BulkUpdateData = {}
    enabledFields.forEach(fieldKey => {
      if (formData[fieldKey] !== undefined) {
        dataToSave[fieldKey] = formData[fieldKey]
      }
    })
    onSave(dataToSave)
  }

  const handleClose = () => {
    setFormData({})
    setEnabledFields(new Set())
    onClose()
  }

  const renderField = (field: BulkEditField) => {
    const isEnabled = enabledFields.has(field.key)
    const value = formData[field.key] || ''

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`enable-${field.key}`}
            checked={isEnabled}
            onChange={() => handleFieldToggle(field.key)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`enable-${field.key}`} className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>

        {isEnabled && (
          <div className="ml-7">
            {field.type === 'text' && (
              <Input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full"
              />
            )}

            {field.type === 'number' && (
              <Input
                type="number"
                value={value}
                onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                placeholder={field.placeholder}
                className="w-full"
              />
            )}

            {field.type === 'date' && (
              <Input
                type="date"
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="w-full"
              />
            )}

            {field.type === 'select' && field.options && (
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {field.label}</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'boolean' && (
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {field.label}</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            )}
          </div>
        )}
      </div>
    )
  }

  const hasEnabledFields = enabledFields.size > 0
  const hasValidData = hasEnabledFields && Array.from(enabledFields).some(key =>
    formData[key] !== undefined && formData[key] !== ''
  )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Bulk Edit ${entityName}s`} size="lg">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            You are about to update <span className="font-semibold">{selectedCount}</span> {entityName}s.
            Select the fields you want to update and provide the new values.
          </p>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {fields.map(renderField)}
        </div>

        {!hasEnabledFields && (
          <div className="text-center py-4 text-gray-500">
            Select at least one field to update
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasValidData || loading}
            loading={loading}
          >
            Update {selectedCount} {entityName}s
          </Button>
        </div>
      </div>
    </Modal>
  )
}