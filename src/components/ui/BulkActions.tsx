import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Trash2, Edit, Archive, MoreVertical } from 'lucide-react'
import Button from './Button'
import { cn } from '@/utils/cn'

export interface BulkAction {
  id: string
  label: string
  icon: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  onClick: () => void
  disabled?: boolean
  standalone?: boolean // Actions that don't require selection
}

interface BulkActionsProps {
  selectedCount: number
  totalCount: number
  onClearSelection: () => void
  actions: BulkAction[]
  className?: string
}

export default function BulkActions({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  className
}: BulkActionsProps) {
  const standaloneActions = actions.filter(action => action.standalone)
  const selectionActions = actions.filter(action => !action.standalone)

  return (
    <div className="space-y-4">
      {/* Standalone Actions - Always visible */}
      {standaloneActions.length > 0 && (
        <div className="flex items-center gap-2">
          {standaloneActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
              disabled={action.disabled}
              className="gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Selection-based Actions - Only when items are selected */}
      {selectedCount > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-20 left-1/2 transform -translate-x-1/2 z-50',
              'bg-white border border-gray-200 rounded-lg shadow-lg',
              'px-4 py-3 flex items-center gap-4',
              'min-w-96',
              className
            )}
          >
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-900">
                {selectedCount} of {totalCount} selected
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="p-1 h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              {selectionActions.slice(0, 3).map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}

              {selectionActions.length > 3 && (
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-32">
                    {selectionActions.slice(3).map((action) => (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

// Common bulk action configurations
export const commonBulkActions = {
  delete: (onClick: () => void): BulkAction => ({
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'danger' as const,
    onClick
  }),

  export: (onClick: () => void): BulkAction => ({
    id: 'export',
    label: 'Export',
    icon: <Download className="w-4 h-4" />,
    variant: 'secondary' as const,
    onClick
  }),

  edit: (onClick: () => void): BulkAction => ({
    id: 'edit',
    label: 'Edit',
    icon: <Edit className="w-4 h-4" />,
    variant: 'secondary' as const,
    onClick
  }),

  archive: (onClick: () => void): BulkAction => ({
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    variant: 'secondary' as const,
    onClick
  })
}