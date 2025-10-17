import { ReactNode } from 'react'
import { AlertTriangle, Trash2, Edit, Download, Archive } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export interface BulkConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  action: 'delete' | 'edit' | 'export' | 'archive' | 'custom'
  selectedCount: number
  entityName: string
  loading?: boolean
  customTitle?: string
  customMessage?: string
  customIcon?: ReactNode
}

const actionConfig = {
  delete: {
    title: 'Delete Items',
    icon: <Trash2 className="w-6 h-6 text-red-500" />,
    confirmText: 'Delete',
    confirmVariant: 'danger' as const,
    getMessage: (count: number, entity: string) =>
      `Are you sure you want to delete ${count} ${entity}${count > 1 ? 's' : ''}? This action cannot be undone.`
  },
  edit: {
    title: 'Bulk Edit',
    icon: <Edit className="w-6 h-6 text-blue-500" />,
    confirmText: 'Update',
    confirmVariant: 'primary' as const,
    getMessage: (count: number, entity: string) =>
      `You are about to update ${count} ${entity}${count > 1 ? 's' : ''}. Continue?`
  },
  export: {
    title: 'Export Data',
    icon: <Download className="w-6 h-6 text-green-500" />,
    confirmText: 'Export',
    confirmVariant: 'success' as const,
    getMessage: (count: number, entity: string) =>
      `Export ${count} ${entity}${count > 1 ? 's' : ''} to CSV file?`
  },
  archive: {
    title: 'Archive Items',
    icon: <Archive className="w-6 h-6 text-orange-500" />,
    confirmText: 'Archive',
    confirmVariant: 'secondary' as const,
    getMessage: (count: number, entity: string) =>
      `Archive ${count} ${entity}${count > 1 ? 's' : ''}? They will be moved to archived status.`
  },
  custom: {
    title: 'Confirm Action',
    icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    confirmText: 'Confirm',
    confirmVariant: 'primary' as const,
    getMessage: (count: number, entity: string) =>
      `Perform this action on ${count} ${entity}${count > 1 ? 's' : ''}?`
  }
}

export default function BulkConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  selectedCount,
  entityName,
  loading = false,
  customTitle,
  customMessage,
  customIcon
}: BulkConfirmationProps) {
  const config = actionConfig[action]

  const title = customTitle || config.title
  const message = customMessage || config.getMessage(selectedCount, entityName)
  const icon = customIcon || config.icon

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-gray-700">{message}</p>
            {action === 'delete' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ This action is permanent and cannot be undone.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {config.confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}