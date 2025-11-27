import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Search, Loader2, Box, Hash, Wallet, FileCode } from 'lucide-react'
import { css } from '@/styled-system/css'
import { api } from '@/lib/api'
import { detectSearchInputType, formatAddress, type SearchInputType } from '@/lib/utils'

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
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect input type as user types
  const inputType = useMemo(() => detectSearchInputType(query), [query])

  // Result item config for display
  const resultConfig: Record<SearchInputType, { icon: typeof Search; label: string; format: (q: string) => string }> = {
    block_height: { icon: Box, label: 'Block', format: (q) => `#${q}` },
    tx_hash: { icon: Hash, label: 'Transaction', format: (q) => formatAddress(q, 10) },
    evm_tx_hash: { icon: Hash, label: 'EVM Transaction', format: (q) => formatAddress(q, 10) },
    bech32_address: { icon: Wallet, label: 'Wallet', format: (q) => formatAddress(q, 10) },
    evm_address: { icon: FileCode, label: 'Address', format: (q) => formatAddress(q, 10) },
    unknown: { icon: Search, label: 'Search', format: (q) => q }
  }

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
   * Uses client-side detection first, then falls back to API search
   */
  const handleSearch = async () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    setIsSearching(true)
    setError(null)

    try {
      // Use client-side detection for direct navigation
      switch (inputType) {
        case 'block_height':
          navigate(`/blocks/${trimmedQuery}`)
          setQuery('')
          setIsOpen(false)
          return

        case 'tx_hash':
          navigate(`/tx/${trimmedQuery}`)
          setQuery('')
          setIsOpen(false)
          return

        case 'evm_tx_hash':
          // For EVM tx hash, we need to find the cosmos tx id via API
          break

        case 'bech32_address':
        case 'evm_address':
          navigate(`/addr/${trimmedQuery}`)
          setQuery('')
          setIsOpen(false)
          return

        case 'unknown':
          // Fall through to API search
          break
      }

      // Fall back to API search for EVM tx hashes and unknown types
      const results = await api.search(trimmedQuery)

      if (results.length === 0) {
        setError('No results found')
        return
      }

      const result = results[0]

      switch (result.type) {
        case 'block':
          navigate(`/blocks/${result.value.height || result.value.id}`)
          break
        case 'transaction':
          navigate(`/tx/${result.value.id}`)
          break
        case 'evm_transaction':
          navigate(`/tx/${result.value.tx_id}?evm=true`)
          break
        case 'address':
        case 'evm_address':
          navigate(`/addr/${result.value.address}`)
          break
        default:
          setError('Unknown result type')
          return
      }

      setQuery('')
      setIsOpen(false)
    } catch (err) {
      console.error('Search failed:', err)
      setError('Search failed')
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
              <kbd className={css(styles.kbd)}>Ctrl+K</kbd>
            </>
          )}
        </div>
      </div>

      {isOpen && query && (
        <div className={css(styles.dropdown)}>
          {error ? (
            <div className={css(styles.errorText)}>{error}</div>
          ) : inputType !== 'unknown' ? (
            <button
              type="button"
              className={css(styles.resultItem)}
              onClick={handleSearch}
              onMouseDown={(e) => e.preventDefault()}
            >
              {(() => {
                const config = resultConfig[inputType]
                const Icon = config.icon
                return (
                  <>
                    <Icon className={css(styles.resultIcon)} />
                    <span className={css(styles.resultLabel)}>{config.label}</span>
                    <span className={css(styles.resultValue)}>{config.format(query.trim())}</span>
                  </>
                )
              })()}
            </button>
          ) : (
            <div className={css(styles.dropdownText)}>
              No match - try a block height, tx hash, or address
            </div>
          )}
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
  errorText: {
    fontSize: 'xs',
    color: 'red.500',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.375rem',
    borderRadius: 'sm',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left',
    _hover: {
      backgroundColor: 'muted',
    },
  },
  resultIcon: {
    height: '0.875rem',
    width: '0.875rem',
    color: 'muted.foreground',
    flexShrink: 0,
  },
  resultLabel: {
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'foreground',
  },
  resultValue: {
    fontSize: 'xs',
    fontFamily: 'mono',
    color: 'muted.foreground',
    marginLeft: 'auto',
  },
}
