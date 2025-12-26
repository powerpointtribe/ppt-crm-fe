import { ReactNode } from 'react'
import { Search, Filter, ChevronDown, X } from 'lucide-react'
import Button from './Button'
import SearchWithAutocomplete, { SearchResult } from './SearchWithAutocomplete'

interface PageToolbarProps {
  // Search
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchSubmit?: (e: React.FormEvent) => void
  searchPlaceholder?: string

  // Autocomplete search
  enableAutocomplete?: boolean
  onFetchResults?: (query: string) => Promise<SearchResult[]>
  onSelectResult?: (result: SearchResult) => void

  // Filters - can be custom filter elements
  filters?: ReactNode
  showFiltersButton?: boolean
  filtersOpen?: boolean
  onToggleFilters?: () => void
  hasActiveFilters?: boolean
  onClearFilters?: () => void

  // Primary actions (right side)
  primaryActions?: ReactNode

  // Secondary actions (after search, before primary)
  secondaryActions?: ReactNode

  // Custom left content (replaces search)
  leftContent?: ReactNode

  // Custom right content (replaces actions)
  rightContent?: ReactNode
}

export default function PageToolbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search...',
  enableAutocomplete = false,
  onFetchResults,
  onSelectResult,
  filters,
  showFiltersButton = false,
  filtersOpen = false,
  onToggleFilters,
  hasActiveFilters = false,
  onClearFilters,
  primaryActions,
  secondaryActions,
  leftContent,
  rightContent,
}: PageToolbarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchSubmit?.(e)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Main Toolbar Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Left Side - Search or Custom Content */}
        {leftContent ? (
          <div className="flex-1 min-w-[200px]">{leftContent}</div>
        ) : onSearchChange ? (
          enableAutocomplete && onFetchResults ? (
            <div className="flex-1 min-w-[200px] max-w-md">
              <SearchWithAutocomplete
                placeholder={searchPlaceholder}
                value={searchValue}
                onSearch={onSearchChange}
                onFetchResults={onFetchResults}
                onSelectResult={onSelectResult}
                minChars={3}
                maxResults={5}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-shadow"
                />
              </div>
            </form>
          )
        ) : null}

        {/* Secondary Actions / Filters Toggle */}
        <div className="flex items-center gap-2">
          {secondaryActions}

          {showFiltersButton && onToggleFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleFilters}
              className={`flex items-center gap-2 ${hasActiveFilters ? 'border-primary-500 text-primary-600' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </Button>
          )}

          {hasActiveFilters && onClearFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side - Primary Actions or Custom Content */}
        {rightContent ? (
          <div className="flex items-center gap-2">{rightContent}</div>
        ) : primaryActions ? (
          <div className="flex items-center gap-2">{primaryActions}</div>
        ) : null}
      </div>

      {/* Expanded Filters Row */}
      {filtersOpen && filters && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            {filters}
          </div>
        </div>
      )}
    </div>
  )
}

// Reusable filter select component for consistency
interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

export function FilterSelect({ value, onChange, options, placeholder = 'Select...', className = '' }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white min-w-[140px] ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// Reusable date filter component
interface DateFilterProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function DateFilter({ value, onChange, label, className = '' }: DateFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm text-gray-500">{label}</span>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
      />
    </div>
  )
}

// Re-export SearchResult type for use in pages
export type { SearchResult }
