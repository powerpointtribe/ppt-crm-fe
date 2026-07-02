import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Check, Minus } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export interface ExportFieldGroup {
  label: string
  fields: { key: string; label: string }[]
}

interface ExportFieldSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (fields: string[]) => Promise<void>
  fieldGroups: ExportFieldGroup[]
  title?: string
}

export default function ExportFieldSelectorModal({
  isOpen,
  onClose,
  onExport,
  fieldGroups,
  title = 'Export Data',
}: ExportFieldSelectorModalProps) {
  const allFieldKeys = fieldGroups.flatMap((g) => g.fields.map((f) => f.key))
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(allFieldKeys))
  const [isExporting, setIsExporting] = useState(false)

  const allSelected = selectedFields.size === allFieldKeys.length
  const noneSelected = selectedFields.size === 0
  const someSelected = !allSelected && !noneSelected

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedFields(new Set())
    } else {
      setSelectedFields(new Set(allFieldKeys))
    }
  }

  const toggleGroup = (group: ExportFieldGroup) => {
    const groupKeys = group.fields.map((f) => f.key)
    const allGroupSelected = groupKeys.every((k) => selectedFields.has(k))

    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (allGroupSelected) {
        groupKeys.forEach((k) => next.delete(k))
      } else {
        groupKeys.forEach((k) => next.add(k))
      }
      return next
    })
  }

  const handleExport = async () => {
    if (noneSelected) return
    setIsExporting(true)
    try {
      await onExport(Array.from(selectedFields))
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const CheckboxIcon = ({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) => (
    <div
      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
        checked || indeterminate
          ? 'bg-primary-600 border-primary-600 text-white'
          : 'border-gray-300 bg-white'
      }`}
    >
      {indeterminate ? (
        <Minus className="w-3 h-3" />
      ) : checked ? (
        <Check className="w-3 h-3" />
      ) : null}
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <CheckboxIcon checked={allSelected} indeterminate={someSelected} />
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-gray-500">
            {selectedFields.size} of {allFieldKeys.length} fields selected
          </span>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1">
          {fieldGroups.map((group) => {
            const groupKeys = group.fields.map((f) => f.key)
            const allGroupSelected = groupKeys.every((k) => selectedFields.has(k))
            const someGroupSelected = !allGroupSelected && groupKeys.some((k) => selectedFields.has(k))

            return (
              <div key={group.label} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-gray-900"
                >
                  <CheckboxIcon checked={allGroupSelected} indeterminate={someGroupSelected} />
                  {group.label}
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 ml-6">
                  {group.fields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => toggleField(field.key)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-50 text-left"
                    >
                      <CheckboxIcon checked={selectedFields.has(field.key)} />
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={noneSelected || isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : `Export ${selectedFields.size} Fields`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
