import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { YaciAPIClient } from '@yaci/database-client'

/**
 * Universal search bar component for searching blocks, transactions, and addresses
 * Supports keyboard shortcut (Cmd/Ctrl+K) to focus the search input
 * Automatically detects query type and navigates to appropriate detail page
 *
 * @example
 * <SearchBar />
 */
export function SearchBar() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const api = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  /**
   * Handles search execution when user submits a query
   * Determines query type (block, transaction, or address) and navigates to appropriate page
   */
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const results = await api.search(query)

      if (results.length === 0) {
        console.log('No results found')
        return
      }

      const result = results[0]

      switch (result.type) {
        case 'block':
          navigate(`/blocks/${result.value.id}`)
          break
        case 'transaction':
          navigate(`/transactions/${result.value.id}`)
          break
        case 'address':
          navigate(`/addr/${result.value.address}`)
          break
        default:
          console.error('Unknown result type')
      }

      setQuery('')
      setIsOpen(false)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search by block, tx, address..."
          className={cn(
            'h-9 w-[200px] lg:w-[300px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'pr-20'
          )}
        />
        <div className="absolute right-0 top-0 flex h-9 items-center pr-3">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </>
          )}
        </div>
      </div>

      {isOpen && query && (
        <div className="absolute top-10 w-full rounded-md border bg-popover p-2 shadow-md">
          <div className="text-xs text-muted-foreground">
            Press Enter to search
          </div>
        </div>
      )}
    </div>
  )
}