import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type?: string
  path?: string
  icon?: React.ReactNode
}

interface SearchWithAutocompleteProps {
  placeholder?: string
  onSearch: (query: string) => void
  onFetchResults?: (query: string) => Promise<SearchResult[]>
  onSelectResult?: (result: SearchResult) => void
  minChars?: number
  maxResults?: number
  debounceMs?: number
  className?: string
  inputClassName?: string
  value?: string
  navigateOnSelect?: boolean
}

export default function SearchWithAutocomplete({
  placeholder = 'Search...',
  onSearch,
  onFetchResults,
  onSelectResult,
  minChars = 3,
  maxResults = 5,
  debounceMs = 300,
  className,
  inputClassName,
  value: controlledValue,
  navigateOnSelect = true,
}: SearchWithAutocompleteProps) {
  const [query, setQuery] = useState(controlledValue || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setQuery(controlledValue)
    }
  }, [controlledValue])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search for results
  useEffect(() => {
    if (!onFetchResults) return

    if (query.length < minChars) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const fetchedResults = await onFetchResults(query)
        setResults(fetchedResults.slice(0, maxResults))
        setIsOpen(fetchedResults.length > 0)
        setHighlightedIndex(-1)
      } catch (error) {
        console.error('Error fetching search results:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, onFetchResults, minChars, maxResults, debounceMs])

  // Debounced main search callback
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, onSearch, debounceMs])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleSelectResult = useCallback((result: SearchResult) => {
    setIsOpen(false)
    setQuery(result.title)

    if (onSelectResult) {
      onSelectResult(result)
    } else if (navigateOnSelect && result.path) {
      navigate(result.path)
    }
  }, [onSelectResult, navigateOnSelect, navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSearch(query)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelectResult(results[highlightedIndex])
        } else {
          setIsOpen(false)
          onSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'member':
        return 'bg-green-100 text-green-700'
      case 'first-timer':
      case 'first_timer':
        return 'bg-orange-100 text-orange-700'
      case 'group':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && query.length >= minChars) {
              setIsOpen(true)
            }
          }}
          className={cn(
            'w-full pl-9 pr-10 py-2 text-sm border border-gray-200 rounded-lg',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'bg-white transition-shadow',
            inputClassName
          )}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="py-1">
            {results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelectResult(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'w-full px-4 py-2 text-left flex items-center gap-3 transition-colors',
                  highlightedIndex === index
                    ? 'bg-primary-50'
                    : 'hover:bg-gray-50'
                )}
              >
                {result.icon && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {result.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
                {result.type && (
                  <span className={cn(
                    'flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full',
                    getTypeColor(result.type)
                  )}>
                    {result.type}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Enter</kbd> to search all or <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">&uarr;</kbd><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">&darr;</kbd> to navigate
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= minChars && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-500">No results found for "{query}"</p>
            <p className="text-xs text-gray-400 mt-1">Press Enter to search anyway</p>
          </div>
        </div>
      )}

      {/* Typing hint */}
      {query.length > 0 && query.length < minChars && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-500">
              Type {minChars - query.length} more character{minChars - query.length !== 1 ? 's' : ''} to search
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
