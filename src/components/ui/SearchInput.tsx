import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import Input from './Input'

interface SearchInputProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
  className?: string
  defaultValue?: string
}

export default function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  className,
  defaultValue = ""
}: SearchInputProps) {
  const [query, setQuery] = useState(defaultValue)

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => {
      clearTimeout(handler)
    }
  }, [query, onSearch, debounceMs])

  const handleClear = () => {
    setQuery('')
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )
        }
        className="pr-10"
      />
    </div>
  )
}