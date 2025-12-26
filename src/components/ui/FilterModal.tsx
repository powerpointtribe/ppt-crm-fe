import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Filter, RotateCcw, Check } from 'lucide-react'
import Button from './Button'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterField {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options?: FilterOption[]
  placeholder?: string
  type?: 'select' | 'date'
}

export interface DateRangeField {
  id: string
  label: string
  fromValue: string
  toValue: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: () => void
  onReset: () => void
  title?: string
  subtitle?: string
  filters: FilterField[]
  dateRange?: DateRangeField
  activeFilterCount?: number
}

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = 'Filters',
  subtitle = 'Refine your search results',
  filters,
  dateRange,
  activeFilterCount = 0,
}: FilterModalProps) {
  const hasSelections = filters.some(f => f.value) || (dateRange && (dateRange.fromValue || dateRange.toValue))

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Filter className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <p className="text-primary-100 text-sm">{subtitle}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Active filters indicator */}
                {activeFilterCount > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-primary-100">Active filters:</span>
                    <span className="px-2.5 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
                      {activeFilterCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Date Range Filter - At the top */}
                {dateRange && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {dateRange.label}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          From
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={dateRange.fromValue}
                            onChange={(e) => dateRange.onFromChange(e.target.value)}
                            className={`
                              w-full px-4 py-3 cursor-pointer
                              border-2 rounded-xl transition-all duration-200
                              focus:outline-none focus:ring-0 focus:border-primary-500
                              ${dateRange.fromValue
                                ? 'border-primary-500 bg-primary-50 text-gray-900'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                              }
                            `}
                          />
                          {dateRange.fromValue && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          To
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={dateRange.toValue}
                            onChange={(e) => dateRange.onToChange(e.target.value)}
                            className={`
                              w-full px-4 py-3 cursor-pointer
                              border-2 rounded-xl transition-all duration-200
                              focus:outline-none focus:ring-0 focus:border-primary-500
                              ${dateRange.toValue
                                ? 'border-primary-500 bg-primary-50 text-gray-900'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                              }
                            `}
                          />
                          {dateRange.toValue && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Other Filters */}
                {filters.map((filter, index) => (
                  <motion.div
                    key={filter.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (dateRange ? 1 : 0) * 0.05 + index * 0.05 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {filter.label}
                    </label>
                    <div className="relative">
                      <select
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className={`
                          w-full px-4 py-3 appearance-none cursor-pointer
                          border-2 rounded-xl transition-all duration-200
                          focus:outline-none focus:ring-0
                          ${filter.value
                            ? 'border-primary-500 bg-primary-50 text-gray-900'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                          }
                        `}
                      >
                        <option value="">{filter.placeholder || `Select ${filter.label}`}</option>
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {/* Custom dropdown arrow */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                        {filter.value && (
                          <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <svg
                          className={`w-5 h-5 transition-colors ${filter.value ? 'text-primary-500' : 'text-gray-400'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onReset}
                    disabled={!hasSelections}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${hasSelections
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        : 'text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset All
                  </button>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={onApply}
                      className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
