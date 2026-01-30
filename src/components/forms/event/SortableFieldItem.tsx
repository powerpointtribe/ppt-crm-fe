import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Settings,
  Trash2,
  Copy,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  ChevronDown,
  Circle,
  CheckSquare,
  ListChecks,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react'
import { EnhancedCustomField, getFieldTypeConfig } from '@/types/registration-form'
import { cn } from '@/utils/cn'

interface SortableFieldItemProps {
  field: EnhancedCustomField
  onEdit: (field: EnhancedCustomField) => void
  onDelete: (fieldId: string) => void
  onDuplicate: (field: EnhancedCustomField) => void
  isSelected?: boolean
}

const iconMap: Record<string, React.ElementType> = {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  ChevronDown,
  Circle,
  CheckSquare,
  ListChecks,
  Star,
}

export default function SortableFieldItem({
  field,
  onEdit,
  onDelete,
  onDuplicate,
  isSelected,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const config = getFieldTypeConfig(field.type)
  const Icon = config ? iconMap[config.icon] || Type : Type

  const hasConditionalLogic = field.conditionalLogic?.enabled && field.conditionalLogic.rules.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white rounded-lg border p-3 transition-all duration-150',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary-500',
        isSelected ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 focus:outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Field Icon */}
        <div className="p-1.5 rounded-md bg-gray-100">
          <Icon className="h-3.5 w-3.5 text-gray-600" />
        </div>

        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-gray-900 truncate">{field.label}</span>
            {field.required && (
              <span className="text-red-500 text-xs">*</span>
            )}
            {hasConditionalLogic && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 text-[10px] font-medium">
                {field.conditionalLogic?.action === 'show' ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{config?.label || field.type}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onDuplicate(field)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(field)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Edit"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(field.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
