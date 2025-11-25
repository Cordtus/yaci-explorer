import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getDenomMetadata } from '@/lib/denom'

interface DenomContextType {
  getDenomDisplay: (denom: string) => string
  isLoading: boolean
}

const DenomContext = createContext<DenomContextType | undefined>(undefined)

interface DenomMetadataRow {
  denom: string
  symbol: string
}

/**
 * Global denom resolution cache
 * Loads from database at app startup and caches all denom mappings
 */
export function DenomProvider({ children }: { children: ReactNode }) {
  const [denomCache, setDenomCache] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDenomMetadata = async () => {
      try {
        const postgrestUrl = import.meta.env.VITE_POSTGREST_URL
        if (!postgrestUrl) {
          throw new Error('VITE_POSTGREST_URL environment variable is not set')
        }
        const response = await fetch(`${postgrestUrl}/denom_metadata?select=denom,symbol`)

        if (!response.ok) {
          console.error('Failed to fetch denom metadata from database')
          setIsLoading(false)
          return
        }

        const metadata: DenomMetadataRow[] = await response.json()
        const cache = new Map<string, string>()

        // Build cache from database
        metadata.forEach((row) => {
          cache.set(row.denom, row.symbol)
        })

        setDenomCache(cache)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading denom metadata:', error)
        setIsLoading(false)
      }
    }

    loadDenomMetadata()
  }, [])

  const getDenomDisplay = (denom: string): string => {
    // Check cache first
    if (denomCache.has(denom)) {
      return denomCache.get(denom)!
    }

    // For IBC denoms, return as-is if not in cache (will be truncated by UI)
    if (denom.startsWith('ibc/')) {
      return denom
    }

    // For native denoms, use static metadata (no setState during render)
    const metadata = getDenomMetadata(denom)
    return metadata.symbol
  }

  return (
    <DenomContext.Provider value={{ getDenomDisplay, isLoading }}>
      {children}
    </DenomContext.Provider>
  )
}

export function useDenom() {
  const context = useContext(DenomContext)
  if (context === undefined) {
    throw new Error('useDenom must be used within a DenomProvider')
  }
  return context
}
