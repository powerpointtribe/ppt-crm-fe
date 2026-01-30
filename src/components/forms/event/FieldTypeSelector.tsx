import {
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
} from 'lucide-react'
import { CustomFieldType, FIELD_TYPE_CONFIGS } from '@/types/registration-form'
import { cn } from '@/utils/cn'

interface FieldTypeSelectorProps {
  onSelect: (type: CustomFieldType) => void
  disabled?: boolean
}

// Map icon names to actual icon components
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

export default function FieldTypeSelector({ onSelect, disabled }: FieldTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add Field</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FIELD_TYPE_CONFIGS.map((config) => {
          const Icon = iconMap[config.icon] || Type
          return (
            <button
              key={config.type}
              type="button"
              onClick={() => onSelect(config.type)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white',
                'hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                'text-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title={config.description}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
