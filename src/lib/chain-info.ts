// Dynamic chain information detected from blockchain data

import { YaciAPIClient } from './api/client'

export interface ChainInfo {
  chainId: string
  chainName: string
  baseDenom: string
  displayDenom: string
  decimals: number
}

let cachedChainInfo: ChainInfo | null = null

/**
 * Detect chain information from actual blockchain data
 * This reads the chain ID from blocks and denom from transactions
 */
export async function getChainInfo(api: YaciAPIClient): Promise<ChainInfo> {
  // Return cached if available
  if (cachedChainInfo) {
    return cachedChainInfo
  }

  try {
    // Get latest block to extract chain ID
    const latestBlock = await api.getLatestBlock()
    const chainId = latestBlock?.data?.block?.header?.chainId || 'unknown'

    // Get recent transaction to extract denom
    const txs = await api.getTransactions(1, 0)
    const baseDenom = txs?.data?.[0]?.fee?.amount?.[0]?.denom || 'unknown'

    // Convert base denom to display denom (remove 'a' prefix for atto- denoms)
    const displayDenom = baseDenom.startsWith('a')
      ? baseDenom.slice(1).toUpperCase()
      : baseDenom.toUpperCase()

    // Detect decimals (18 for atto- prefix, 6 for micro- prefix, 0 otherwise)
    const decimals = baseDenom.startsWith('a')
      ? 18
      : baseDenom.startsWith('u')
        ? 6
        : 0

    // Generate human-readable chain name from chain ID
    const chainName = generateChainName(chainId)

    cachedChainInfo = {
      chainId,
      chainName,
      baseDenom,
      displayDenom,
      decimals,
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
    }
  }
}

/**
 * Generate a human-readable chain name from chain ID
 */
function generateChainName(chainId: string): string {
  // Common chain ID patterns
  if (chainId === '9001') return 'EVM Testnet'
  if (chainId.includes('testnet')) return chainId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  if (chainId.includes('mainnet')) return chainId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())

  // Default: use chain ID as-is
  return `Chain ${chainId}`
}

/**
 * Clear cached chain info (useful for testing or chain switches)
 */
export function clearChainInfoCache() {
  cachedChainInfo = null
}
