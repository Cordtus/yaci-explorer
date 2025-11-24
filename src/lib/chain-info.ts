// Dynamic chain information detected from blockchain data

import type { YaciClient } from '@/lib/api'
import { getChainConfig, type ChainFeatures } from '@/config/chains'

export interface ChainInfo {
  chainId: string
  chainName: string
  baseDenom: string
  displayDenom: string
  decimals: number
  features: ChainFeatures
}

let cachedChainInfo: ChainInfo | null = null

/**
 * Detect chain information from actual blockchain data
 * Uses chain registry config if available, falls back to auto-detection
 */
export async function getChainInfo(api: YaciClient): Promise<ChainInfo> {
  // Return cached if available
  if (cachedChainInfo) {
    return cachedChainInfo
  }

  try {
    // Get latest block to extract chain ID
    const latestBlock = await api.getLatestBlock()
    const chainId = latestBlock?.data?.block?.header?.chain_id || (latestBlock?.data?.block?.header as any)?.chainId || 'unknown'

    // Try to get config from registry
    const config = getChainConfig(chainId)

    // Get actual denom from transactions (may differ from config)
    let baseDenom = config.nativeDenom
    try {
      const txs = await api.getTransactions(1, 0)
      const detectedDenom = txs?.data?.[0]?.fee?.amount?.[0]?.denom
      if (detectedDenom) {
        baseDenom = detectedDenom
      }
    } catch {
      // Use config denom if detection fails
    }

    // Use config values or fall back to auto-detection
    const displayDenom = config.nativeSymbol || autoDetectDisplayDenom(baseDenom)
    const decimals = config.decimals || autoDetectDecimals(baseDenom)

    cachedChainInfo = {
      chainId,
      chainName: config.name,
      baseDenom,
      displayDenom,
      decimals,
      features: config.features,
    }

    return cachedChainInfo
  } catch (error) {
    console.error('Failed to detect chain info:', error)
    // Return defaults if detection fails
    return {
      chainId: 'unknown',
      chainName: 'Unknown Network',
      baseDenom: 'unknown',
      displayDenom: 'UNKNOWN',
      decimals: 6,
      features: {
        evm: false,
        ibc: true,
        wasm: false,
      },
    }
  }
}

/**
 * Auto-detect display denom from base denom
 */
function autoDetectDisplayDenom(baseDenom: string): string {
  if (baseDenom.startsWith('a')) {
    return baseDenom.slice(1).toUpperCase()
  }
  if (baseDenom.startsWith('u')) {
    return baseDenom.slice(1).toUpperCase()
  }
  return baseDenom.toUpperCase()
}

/**
 * Auto-detect decimals from base denom
 */
function autoDetectDecimals(baseDenom: string): number {
  if (baseDenom.startsWith('a')) return 18 // atto- prefix (10^-18)
  if (baseDenom.startsWith('u')) return 6  // micro- prefix (10^-6)
  return 0 // no prefix
}

/**
 * Clear cached chain info (useful for testing or chain switches)
 */
export function clearChainInfoCache() {
  cachedChainInfo = null
}
