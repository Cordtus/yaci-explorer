import { createContext, useContext, useState, type ReactNode } from 'react'
import { getDenomMetadata, extractIBCHash } from '@/lib/denom'
import { getIBCDenomFromCache } from '@/lib/ibc-resolver'

interface DenomContextType {
  getDenomDisplay: (denom: string) => string
  isLoading: boolean
}

const DenomContext = createContext<DenomContextType | undefined>(undefined)

/**
 * Global denom resolution cache
 * Uses static mappings for known denoms and browser cache for IBC denoms
 */
export function DenomProvider({ children }: { children: ReactNode }) {
  const [denomCache] = useState<Map<string, string>>(new Map())
  const isLoading = false // No async loading needed - everything is local/cached

  const getDenomDisplay = (denom: string): string => {
    // Check in-memory cache first
    if (denomCache.has(denom)) {
      return denomCache.get(denom)!
    }

    // For IBC denoms, check browser cache
    if (denom.startsWith('ibc/')) {
      const hash = extractIBCHash(denom)
      if (hash) {
        const cached = getIBCDenomFromCache(hash)
        if (cached) {
          return cached.symbol
        }
      }
      // If not resolved, return the denom as-is (will be truncated by UI)
      // The useIBCResolver hook will handle async resolution
      return denom
    }

    // For native denoms, use static metadata
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
