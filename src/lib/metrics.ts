import { api } from '@/lib/api'
import { getChainInfo, type ChainInfo } from '@/lib/chain-info'

export interface OverviewMetrics {
  latestBlock: number
  totalTransactions: number
  avgBlockTime: number
  tps: number
  activeValidators: number
  totalSupply: string | null
}

const REST_ENDPOINT = import.meta.env.VITE_CHAIN_REST_ENDPOINT
const BASE_URL = import.meta.env.VITE_POSTGREST_URL || 'http://localhost:3000'

async function countRows(url: string): Promise<number> {
  const response = await fetch(url, { headers: { Prefer: 'count=exact' } })
  if (!response.ok) return 0
  const totalHeader = response.headers.get('Content-Range')
  return totalHeader ? parseInt(totalHeader.split('/')[1]) : 0
}

async function getTotalTransactions(): Promise<number> {
  return countRows(`${BASE_URL}/transactions_main?select=id&limit=1`)
}

async function getTpsLastMinute(): Promise<number> {
  const start = new Date(Date.now() - 60_000).toISOString()
  const count = await countRows(
    `${BASE_URL}/transactions_main?timestamp=gte.${start}&select=id&limit=1`
  )
  return count / 60
}

async function getActiveValidators(): Promise<number> {
  if (REST_ENDPOINT) {
    try {
      const res = await fetch(
        `${REST_ENDPOINT}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED`
      )
      if (res.ok) {
        const data = (await res.json()) as { validators?: unknown[] }
        return Array.isArray(data.validators) ? data.validators.length : 0
      }
    } catch {
      // fall back to block-derived count
    }
  }

  const latestBlock = await api.getLatestBlock()
  return latestBlock?.data?.block?.last_commit?.signatures?.length || 0
}

async function getTotalSupply(chainInfo: ChainInfo): Promise<string | null> {
  if (!REST_ENDPOINT) return null
  try {
    const res = await fetch(
      `${REST_ENDPOINT}/cosmos/bank/v1beta1/supply/by_denom?denom=${chainInfo.baseDenom}`
    )
    if (!res.ok) return null
    const data = (await res.json()) as { amount?: { amount?: string } }
    const raw = data.amount?.amount ? parseFloat(data.amount.amount) : NaN
    if (Number.isNaN(raw)) return null
    return (raw / Math.pow(10, chainInfo.decimals)).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })
  } catch {
    return null
  }
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const chainInfo = await getChainInfo(api)
  const [latestBlock, blockTimeAnalysis, totalTransactions, tps, activeValidators, totalSupply] =
    await Promise.all([
      api.getLatestBlock(),
      api.getBlockTimeAnalysis(100),
      getTotalTransactions(),
      getTpsLastMinute(),
      getActiveValidators(),
      getTotalSupply(chainInfo),
    ])

  return {
    latestBlock: latestBlock?.id || 0,
    totalTransactions,
    avgBlockTime: blockTimeAnalysis.avg > 0 ? blockTimeAnalysis.avg : 0,
    tps,
    activeValidators,
    totalSupply,
  }
}
