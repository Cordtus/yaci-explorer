/**
 * Denomination utilities for Cosmos SDK chains
 * Handles IBC denoms, native denoms, and display formatting
 */

// Cache for IBC denom traces
const denomTraceCache = new Map<string, DenomTrace>()

export interface DenomTrace {
  baseDenom: string
  path: string
  displayName?: string
  symbol?: string
  decimals?: number
}

export interface DenomMetadata {
  denom: string
  displayName: string
  symbol: string
  decimals: number
  isIBC: boolean
  ibcHash?: string
}

/**
 * Extract IBC hash from ibc/HASH format
 */
export function extractIBCHash(denom: string): string | null {
  if (!denom.startsWith('ibc/')) return null
  return denom.slice(4)
}

/**
 * Resolve IBC denom to base denom using static mapping
 */
export function resolveIBCDenom(denom: string): DenomTrace | null {
  const hash = extractIBCHash(denom)
  if (!hash) return null

  // Check static mapping
  const mapped = IBC_DENOM_MAP[hash.toUpperCase()]
  if (mapped) {
    return {
      baseDenom: mapped.baseDenom,
      path: `transfer/channel-*`, // Path is not critical for display
    }
  }

  return null
}

/**
 * Common denom display names and symbols
 */
const KNOWN_DENOMS: Record<string, { name: string; symbol: string; decimals: number }> = {
  ujuno: { name: 'Juno', symbol: 'JUNO', decimals: 6 },
  uatom: { name: 'Cosmos Hub', symbol: 'ATOM', decimals: 6 },
  uosmo: { name: 'Osmosis', symbol: 'OSMO', decimals: 6 },
  uakt: { name: 'Akash', symbol: 'AKT', decimals: 6 },
  ustars: { name: 'Stargaze', symbol: 'STARS', decimals: 6 },
  aevmos: { name: 'Evmos', symbol: 'EVMOS', decimals: 18 },
  inj: { name: 'Injective', symbol: 'INJ', decimals: 18 },
  axl: { name: 'Axelar', symbol: 'AXL', decimals: 6 },
  umfx: { name: 'Manifest', symbol: 'MFX', decimals: 6 },
  upoa: { name: 'POA', symbol: 'POA', decimals: 6 },
  // Add more as needed
}

/**
 * Known IBC denom mappings
 * Map IBC hash to base denom info
 */
const IBC_DENOM_MAP: Record<string, { baseDenom: string; chain: string }> = {
  // Cosmos Hub ATOM on Juno (transfer/channel-1)
  'C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9': { baseDenom: 'uatom', chain: 'cosmoshub' },
  // Add more IBC denom mappings as they're discovered
}

/**
 * Get display metadata for a denomination
 */
export function getDenomMetadata(denom: string): DenomMetadata {
  // Check if it's an IBC denom
  const ibcHash = extractIBCHash(denom)
  if (ibcHash) {
    return {
      denom,
      displayName: denom,
      symbol: denom,
      decimals: 6, // Default for most Cosmos tokens
      isIBC: true,
      ibcHash,
    }
  }

  // Check known denoms
  const known = KNOWN_DENOMS[denom.toLowerCase()]
  if (known) {
    return {
      denom,
      displayName: known.name,
      symbol: known.symbol,
      decimals: known.decimals,
      isIBC: false,
    }
  }

  // Handle micro denoms (u-prefix)
  if (denom.startsWith('u')) {
    const baseDenom = denom.slice(1).toUpperCase()
    return {
      denom,
      displayName: baseDenom,
      symbol: baseDenom,
      decimals: 6,
      isIBC: false,
    }
  }

  // Handle atto denoms (a-prefix, for EVM chains)
  if (denom.startsWith('a')) {
    const baseDenom = denom.slice(1).toUpperCase()
    return {
      denom,
      displayName: baseDenom,
      symbol: baseDenom,
      decimals: 18,
      isIBC: false,
    }
  }

  // Default fallback
  return {
    denom,
    displayName: denom,
    symbol: denom.toUpperCase(),
    decimals: 0,
    isIBC: false,
  }
}

/**
 * Format amount with proper decimals
 */
export function formatDenomAmount(
  amount: string | number,
  denom: string,
  options?: {
    decimals?: number
    maxDecimals?: number
    abbreviated?: boolean
  }
): string {
  const metadata = getDenomMetadata(denom)
  const decimals = options?.decimals ?? metadata.decimals
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) return '0'

  // Convert from base units
  const converted = numAmount / 10 ** decimals

  // Abbreviate large numbers if requested
  if (options?.abbreviated) {
    if (converted >= 1e9) return `${(converted / 1e9).toFixed(2)}B`
    if (converted >= 1e6) return `${(converted / 1e6).toFixed(2)}M`
    if (converted >= 1e3) return `${(converted / 1e3).toFixed(2)}K`
  }

  // Format with appropriate decimal places
  const maxDecimals = options?.maxDecimals ?? 2
  return converted.toFixed(maxDecimals)
}

/**
 * Get display symbol for denomination
 */
export function getDenomSymbol(denom: string): string {
  const metadata = getDenomMetadata(denom)
  return metadata.symbol
}

/**
 * Format a full amount with denom (e.g., "123.45 JUNO")
 */
export function formatAmountWithDenom(
  amount: string | number,
  denom: string,
  options?: {
    decimals?: number
    maxDecimals?: number
    abbreviated?: boolean
    useSymbol?: boolean
  }
): string {
  const formattedAmount = formatDenomAmount(amount, denom, options)
  const metadata = getDenomMetadata(denom)
  const denomDisplay = options?.useSymbol ? metadata.symbol : metadata.displayName

  return `${formattedAmount} ${denomDisplay}`
}
