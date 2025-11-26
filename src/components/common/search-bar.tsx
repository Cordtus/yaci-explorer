import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Search, Loader2 } from 'lucide-react'
import { css } from '@/styled-system/css'
import { api } from '@/lib/api'

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
          navigate(`/tx/${result.value.id}`)
          break
        case 'evm_transaction':
          // EVM hash search - navigate to tx with EVM view enabled
          navigate(`/tx/${result.value.tx_id}?evm=true`)
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
    <div className={css(styles.container)}>
      <div className={css(styles.inputWrapper)}>
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
          className={css(styles.input)}
        />
        <div className={css(styles.iconContainer)}>
          {isSearching ? (
            <Loader2 className={css(styles.spinner)} />
          ) : (
            <>
              <Search className={css(styles.searchIcon)} />
              <kbd className={css(styles.kbd)}>
                <span className={css(styles.cmdSymbol)}>⌘</span>K
              </kbd>
            </>
          )}
        </div>
      </div>

      {isOpen && query && (
        <div className={css(styles.dropdown)}>
          <div className={css(styles.dropdownText)}>
            Press Enter to search
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: '2.25rem',
    width: '200px',
    lg: { width: '300px' },
    borderRadius: 'md',
    border: '1px solid',
    borderColor: 'input',
    backgroundColor: 'background',
    paddingLeft: '0.75rem',
    paddingRight: '5rem',
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
    fontSize: 'sm',
    boxShadow: 'sm',
    transitionProperty: 'colors',
    transitionDuration: 'normal',
    _placeholder: {
      color: 'muted.foreground',
    },
    _focusVisible: {
      outline: 'none',
      ring: '1px',
      ringColor: 'ring',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  iconContainer: {
    position: 'absolute',
    right: '0',
    top: '0',
    display: 'flex',
    height: '2.25rem',
    alignItems: 'center',
    paddingRight: '0.75rem',
  },
  spinner: {
    height: '1rem',
    width: '1rem',
    animation: 'spin',
    color: 'muted.foreground',
  },
  searchIcon: {
    height: '1rem',
    width: '1rem',
    color: 'muted.foreground',
    marginRight: '0.5rem',
  },
  kbd: {
    pointerEvents: 'none',
    display: 'inline-flex',
    height: '1.25rem',
    userSelect: 'none',
    alignItems: 'center',
    gap: '0.25rem',
    borderRadius: 'sm',
    border: '1px solid',
    backgroundColor: 'muted',
    paddingLeft: '0.375rem',
    paddingRight: '0.375rem',
    fontFamily: 'mono',
    fontSize: '10px',
    fontWeight: 'medium',
    color: 'muted.foreground',
  },
  cmdSymbol: {
    fontSize: 'xs',
  },
  dropdown: {
    position: 'absolute',
    top: '2.5rem',
    width: '100%',
    borderRadius: 'md',
    border: '1px solid',
    backgroundColor: 'popover',
    padding: '0.5rem',
    boxShadow: 'md',
  },
  dropdownText: {
    fontSize: 'xs',
    color: 'muted.foreground',
  },
}
