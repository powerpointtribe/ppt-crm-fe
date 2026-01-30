import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FormSection as FormSectionType } from '@/types/registration-form'
import { cn } from '@/utils/cn'

interface FormSectionProps {
  section: FormSectionType
  children: React.ReactNode
  isActive?: boolean
}

export default function FormSection({ section, children, isActive = true }: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded !== false)

  const canCollapse = section.collapsible

  const handleToggle = () => {
    if (canCollapse) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all duration-300',
        isActive ? 'border-primary-200 bg-white' : 'border-gray-200 bg-gray-50'
      )}
    >
      {/* Section Header */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={!canCollapse}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between text-left transition-colors',
          canCollapse && 'hover:bg-gray-50 cursor-pointer',
          !canCollapse && 'cursor-default',
          isExpanded ? 'border-b border-gray-100' : ''
        )}
      >
        <div>
          <h3 className="font-medium text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
          )}
        </div>
        {canCollapse && (
          <div className="ml-4 text-gray-400">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        )}
      </button>

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
