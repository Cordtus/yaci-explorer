import { useDenom } from '@/contexts/DenomContext'

/**
 * Hook to resolve and display denominations
 * Uses global denom cache from context
 */
export function useDenomResolver(denom: string) {
  const { getDenomDisplay } = useDenom()
  const resolvedDenom = getDenomDisplay(denom)

  return {
    resolvedDenom,
    isResolving: false,
    originalDenom: denom,
  }
}

/**
 * Hook to resolve multiple denoms at once
 */
export function useDenomResolverBatch(denoms: string[]) {
  const { getDenomDisplay } = useDenom()

  const resolvedDenoms: Record<string, string> = {}
  denoms.forEach((denom) => {
    resolvedDenoms[denom] = getDenomDisplay(denom)
  })

  return { resolvedDenoms, isResolving: false }
}
