import { YaciAPIClient } from '@/lib/api/client'
import { getChainInfo, type ChainInfo } from '@/lib/chain-info'
import { createTTLCache } from '@/lib/cache'

const client = new YaciAPIClient()
const cache = createTTLCache(30000) // 30s TTL for expensive calls

interface OverviewMetrics {
  latestBlock: number
  totalTransactions: number
  avgBlockTime: number
  tps: number
  activeValidators: number
  totalSupply: string | null
}

interface NetworkMetrics {
  latestHeight: number
  totalTransactions: number
  avgBlockTime: number
  activeValidators: number
  totalBlocks: number
  lastBlockTime: string
  txPerBlock: number
  successRate: number
  avgGasLimit: number
  uniqueAddresses: number | null
}

const REST_ENDPOINT = import.meta.env.VITE_CHAIN_REST_ENDPOINT

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`Failed fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

const BASE_URL = client.getApiBaseUrl()

async function getTotalTransactions(): Promise<number> {
  const response = await fetch(`${BASE_URL}/transactions_main?select=id&limit=1`, {
    headers: { Prefer: 'count=exact' },
  })
  if (!response.ok) return 0
  const totalHeader = response.headers.get('Content-Range')
  return totalHeader ? parseInt(totalHeader.split('/')[1]) : 0
}

async function getTransactionsLastMinute(): Promise<number> {
  const response = await fetch(`${BASE_URL}/transactions_main?order=timestamp.desc&limit=200`)
  if (!response.ok) return 0
  const txs = await response.json()
  const oneMinuteAgo = Date.now() - 60000
  return txs.filter((tx: { timestamp?: string | null }) => {
    if (!tx.timestamp) return false
    return new Date(tx.timestamp).getTime() > oneMinuteAgo
  }).length
}

async function getActiveValidators(chainInfo: ChainInfo): Promise<number> {
  // Prefer staking REST if provided
  if (REST_ENDPOINT) {
    try {
      const data = await fetchJson<{ validators: unknown[] }>(
        `${REST_ENDPOINT}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED`
      )
      return Array.isArray(data.validators) ? data.validators.length : 0
    } catch {
      // fall back to block-derived count
    }
  }

  const latestBlock = await client.getLatestBlock()
  return (
    latestBlock?.data?.block?.last_commit?.signatures?.length ||
    latestBlock?.data?.block?.lastCommit?.signatures?.length ||
    latestBlock?.data?.lastCommit?.signatures?.length ||
    0
  )
}

async function getTotalSupply(chainInfo: ChainInfo): Promise<string | null> {
  if (!REST_ENDPOINT) return null
  try {
    const data = await fetchJson<{ amount: { amount: string } }>(
      `${REST_ENDPOINT}/cosmos/bank/v1beta1/supply/by_denom?denom=${chainInfo.baseDenom}`
    )
    const raw = data.amount?.amount ? parseFloat(data.amount.amount) : NaN
    if (Number.isNaN(raw)) return null
    const factor = Math.pow(10, chainInfo.decimals)
    return (raw / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })
  } catch {
    return null
  }
}

async function getUniqueAddresses(): Promise<number | null> {
  // Use PostgREST distinct on sender in messages_main
  const response = await fetch(
    `${BASE_URL}/messages_main?select=sender&distinct=sender&sender=not.is.null&limit=1`,
    { headers: { Prefer: 'count=exact' } }
  )
  if (!response.ok) return null
  const totalHeader = response.headers.get('Content-Range')
  return totalHeader ? parseInt(totalHeader.split('/')[1]) : null
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const cached = cache.get<OverviewMetrics>('overview')
  if (cached) return cached

  const chainInfo = await getChainInfo(client)
  const [latestBlock, blockTimeAnalysis, totalTx, txLastMinute, activeValidators, totalSupply] =
    await Promise.all([
      client.getLatestBlock(),
      client.getBlockTimeAnalysis(100),
      getTotalTransactions(),
      getTransactionsLastMinute(),
      getActiveValidators(chainInfo),
      getTotalSupply(chainInfo),
    ])

  const overview: OverviewMetrics = {
    latestBlock: latestBlock?.id || 0,
    totalTransactions: totalTx,
    avgBlockTime: blockTimeAnalysis.avg > 0 ? blockTimeAnalysis.avg : 0,
    tps: txLastMinute / 60,
    activeValidators,
    totalSupply,
  }

  cache.set('overview', overview)
  return overview
}

export async function getNetworkMetrics(): Promise<NetworkMetrics> {
  const cached = cache.get<NetworkMetrics>('network-metrics')
  if (cached) return cached

  const [blocksResponse, txResponse, messagesResponse] = await Promise.all([
    fetch(`${BASE_URL}/blocks_raw?order=id.desc&limit=100`, { headers: { Prefer: 'count=exact' } }),
    fetch(`${BASE_URL}/transactions_main?order=height.desc&limit=1000`, { headers: { Prefer: 'count=exact' } }),
    fetch(`${BASE_URL}/messages_main?select=sender&sender=not.is.null&limit=2000`, {
      headers: { Prefer: 'count=exact' },
    }),
  ])

  const blocks = await blocksResponse.json()
  const transactions = await txResponse.json()
  const totalBlocks = parseInt(blocksResponse.headers.get('content-range')?.split('/')[1] || '0')
  const totalTxs = parseInt(txResponse.headers.get('content-range')?.split('/')[1] || '0')

  // Average block time over recent blocks
  let avgBlockTime = 0
  const blockTimes: number[] = []
  for (let i = 0; i < Math.min(blocks.length - 1, 50); i++) {
    const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
    const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
    const diff = (currentTime - previousTime) / 1000
    if (diff > 0 && diff < 100) blockTimes.push(diff)
  }
  if (blockTimes.length > 0) {
    avgBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length
  }

  const successfulTxs = transactions.filter((tx: any) => !tx.error || tx.error === null).length
  const successRate = transactions.length > 0 ? (successfulTxs / transactions.length) * 100 : 100

  const gasValues: number[] = transactions
    .filter((tx: any) => tx.fee?.gasLimit)
    .map((tx: any) => parseInt(tx.fee.gasLimit, 10))
  const avgGasLimit = gasValues.length > 0
    ? Math.round(gasValues.reduce((a: number, b: number) => a + b, 0) / gasValues.length)
    : 0

  const uniqueAddresses = await getUniqueAddresses()

  const latestBlock = blocks[0]
  const activeValidators =
    latestBlock?.data?.block?.last_commit?.signatures?.length ||
    latestBlock?.data?.block?.lastCommit?.signatures?.length ||
    latestBlock?.data?.lastCommit?.signatures?.length ||
    0

  const metrics: NetworkMetrics = {
    latestHeight: latestBlock?.id || 0,
    totalTransactions: totalTxs,
    avgBlockTime,
    activeValidators,
    totalBlocks,
    lastBlockTime: latestBlock?.data?.block?.header?.time || new Date().toISOString(),
    txPerBlock: totalBlocks > 0 ? Math.round(totalTxs / totalBlocks) : 0,
    successRate,
    avgGasLimit,
    uniqueAddresses,
  }

  cache.set('network-metrics', metrics)
  return metrics
}

export async function getBlockIntervals(limit = 100) {
  const cacheKey = `block-intervals-${limit}`
  const cached = cache.get<Array<{ height: number; time: number; timestamp: string }>>(cacheKey)
  if (cached) return cached

  // getBlockTimeAnalysis returns aggregates; pull series directly from blocks_raw
  const response = await fetch(`${BASE_URL}/blocks_raw?order=id.desc&limit=${limit}`)
  if (!response.ok) return []
  const blocks = await response.json()
  const intervals: Array<{ height: number; time: number; timestamp: string }> = []

  for (let i = 0; i < blocks.length - 1; i++) {
    const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
    const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
    const diff = (currentTime - previousTime) / 1000
    if (diff > 0 && diff < 100) {
      intervals.push({
        height: blocks[i].id,
        time: diff,
        timestamp: blocks[i].data?.block?.header?.time,
      })
    }
  }

  const series = intervals.reverse()
  cache.set(cacheKey, series)
  return series
}
