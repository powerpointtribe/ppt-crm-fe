import { Check } from 'lucide-react'
import { FormSection } from '@/types/registration-form'
import { cn } from '@/utils/cn'

interface FormProgressProps {
  sections: FormSection[]
  currentSectionIndex: number
  onSectionClick?: (index: number) => void
  completedSections?: number[]
}

export default function FormProgress({
  sections,
  currentSectionIndex,
  onSectionClick,
  completedSections = [],
}: FormProgressProps) {
  if (sections.length <= 1) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Desktop Progress */}
      <div className="hidden sm:flex items-center justify-between">
        {sections.map((section, index) => {
          const isCompleted = completedSections.includes(index)
          const isCurrent = index === currentSectionIndex
          const isPast = index < currentSectionIndex

          return (
            <div key={section.id} className="flex items-center flex-1">
              {/* Step Indicator */}
              <button
                type="button"
                onClick={() => onSectionClick?.(index)}
                disabled={!onSectionClick || (!isCompleted && !isPast && !isCurrent)}
                className={cn(
                  'flex flex-col items-center focus:outline-none',
                  onSectionClick && (isCompleted || isPast || isCurrent) && 'cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isCurrent
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-gray-300 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px] truncate',
                    isCurrent ? 'text-primary-600' : 'text-gray-500'
                  )}
                >
                  {section.title}
                </span>
              </button>

              {/* Connector Line */}
              {index < sections.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      'h-0.5 transition-colors duration-300',
                      index < currentSectionIndex ? 'bg-primary-600' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile Progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentSectionIndex + 1} of {sections.length}
          </span>
          <span className="text-sm text-gray-500">
            {sections[currentSectionIndex]?.title}
          </span>
        </div>
        <div className="flex gap-1">
          {sections.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors duration-300',
                index <= currentSectionIndex ? 'bg-primary-600' : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
