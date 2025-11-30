import { api } from '@/lib/api'
import { getChainInfo, type ChainInfo } from '@/lib/chain-info'
import { subMinutes, subHours, subDays } from 'date-fns'
import { getEnv } from '@/lib/env'

// Simple cache implementation
const cacheStore = new Map<string, { value: any; expires: number }>()
const cache = {
  get<T>(key: string): T | null {
    const entry = cacheStore.get(key)
    if (!entry || Date.now() > entry.expires) {
      cacheStore.delete(key)
      return null
    }
    return entry.value as T
  },
  set(key: string, value: any, ttl = 30000) {
    cacheStore.set(key, { value, expires: Date.now() + ttl })
  }
}

// Types
export type TimeUnit = 'minutes' | 'hours' | 'days'

export interface TimeRange {
  value: number
  unit: TimeUnit
}

export interface OverviewMetrics {
  latestBlock: number
  totalTransactions: number
  avgBlockTime: number
  tps: number
  activeValidators: number
  totalSupply: string | null
}

export interface NetworkMetrics {
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

export interface BlockInterval {
  height: number
  time: number
  timestamp: string
}

// Configuration
const REST_ENDPOINT = getEnv('VITE_CHAIN_REST_ENDPOINT')
const BASE_URL = getEnv('VITE_POSTGREST_URL', '/api')!

// Time utilities
function getStartDate(range: TimeRange): Date {
  const now = new Date()
  switch (range.unit) {
    case 'minutes':
      return subMinutes(now, range.value)
    case 'hours':
      return subHours(now, range.value)
    case 'days':
      return subDays(now, range.value)
  }
}

function getTimeRangeMs(range: TimeRange): number {
  const multipliers = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  }
  return range.value * multipliers[range.unit]
}

// Generic fetch helper
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`Failed fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

// Core data fetchers
async function getTotalTransactions(): Promise<number> {
  const response = await fetch(`${BASE_URL}/transactions_main?select=id&limit=1`, {
    headers: { Prefer: 'count=exact' },
  })
  if (!response.ok) return 0
  const totalHeader = response.headers.get('Content-Range')
  return totalHeader ? parseInt(totalHeader.split('/')[1], 10) : 0
}

/**
 * Get transaction count within a time range
 * @param range - Time range specification (e.g., { value: 1, unit: 'minutes' })
 * @returns Number of transactions in the specified time range
 */
export async function getTransactionsInTimeRange(range: TimeRange): Promise<number> {
  const cacheKey = `tx-count-${range.value}-${range.unit}`
  const cached = cache.get<number>(cacheKey)
  if (cached !== null) return cached

  const startDate = getStartDate(range)
  const response = await fetch(
    `${BASE_URL}/transactions_main?timestamp=gte.${startDate.toISOString()}&select=id&limit=1`,
    { headers: { Prefer: 'count=exact' } }
  )

  if (!response.ok) return 0
  const totalHeader = response.headers.get('Content-Range')
  const count = totalHeader ? parseInt(totalHeader.split('/')[1], 10) : 0

  cache.set(cacheKey, count)
  return count
}

/**
 * Calculate transactions per second based on a time range
 * @param range - Time range to calculate TPS over
 */
export async function getTPS(range: TimeRange = { value: 1, unit: 'minutes' }): Promise<number> {
  const count = await getTransactionsInTimeRange(range)
  const seconds = getTimeRangeMs(range) / 1000
  return count / seconds
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

  const latestBlock = await api.getLatestBlock()
  return getValidatorCountFromBlock(latestBlock)
}

function getValidatorCountFromBlock(block: any): number {
  return (
    block?.data?.block?.last_commit?.signatures?.length ||
    block?.data?.block?.lastCommit?.signatures?.length ||
    block?.data?.lastCommit?.signatures?.length ||
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
    const factor = 10 ** chainInfo.decimals
    return (raw / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })
  } catch {
    return null
  }
}

async function getUniqueAddresses(): Promise<number | null> {
  const response = await fetch(
    `${BASE_URL}/messages_main?select=sender&distinct=sender&sender=not.is.null&limit=1`,
    { headers: { Prefer: 'count=exact' } }
  )
  if (!response.ok) return null
  const totalHeader = response.headers.get('Content-Range')
  return totalHeader ? parseInt(totalHeader.split('/')[1], 10) : null
}

/**
 * Calculate average block time from a series of blocks
 */
function calculateAvgBlockTime(blocks: any[], maxBlocks = 50): number {
  const blockTimes: number[] = []
  const limit = Math.min(blocks.length - 1, maxBlocks)

  for (let i = 0; i < limit; i++) {
    const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
    const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
    const diff = (currentTime - previousTime) / 1000
    if (diff > 0 && diff < 100) blockTimes.push(diff)
  }

  if (blockTimes.length === 0) return 0
  return blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length
}

/**
 * Calculate average gas limit from transactions
 */
function calculateAvgGasLimit(transactions: any[]): number {
  const gasValues = transactions
    .filter((tx: any) => tx.fee?.gasLimit)
    .map((tx: any) => parseInt(tx.fee.gasLimit, 10))

  if (gasValues.length === 0) return 0
  return Math.round(gasValues.reduce((a, b) => a + b, 0) / gasValues.length)
}

// Public API

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const cached = cache.get<OverviewMetrics>('overview')
  if (cached) return cached

  const chainInfo = await getChainInfo(api)
  const [latestBlock, blockTimeAnalysis, totalTx, tps, activeValidators, totalSupply] =
    await Promise.all([
      api.getLatestBlock(),
      api.getBlockTimeAnalysis(100),
      getTotalTransactions(),
      getTPS({ value: 1, unit: 'minutes' }),
      getActiveValidators(chainInfo),
      getTotalSupply(chainInfo),
    ])

  const overview: OverviewMetrics = {
    latestBlock: latestBlock?.id || 0,
    totalTransactions: totalTx,
    avgBlockTime: blockTimeAnalysis.avg > 0 ? blockTimeAnalysis.avg : 0,
    tps,
    activeValidators,
    totalSupply,
  }

  cache.set('overview', overview)
  return overview
}

export async function getNetworkMetrics(): Promise<NetworkMetrics> {
  const cached = cache.get<NetworkMetrics>('network-metrics')
  if (cached) return cached

  const [blocksResponse, txResponse] = await Promise.all([
    fetch(`${BASE_URL}/blocks_raw?order=id.desc&limit=100`, { headers: { Prefer: 'count=exact' } }),
    fetch(`${BASE_URL}/transactions_main?order=height.desc&limit=1000`, { headers: { Prefer: 'count=exact' } }),
  ])

  const blocks = await blocksResponse.json()
  const transactions = await txResponse.json()
  const totalBlocks = parseInt(blocksResponse.headers.get('content-range')?.split('/')[1] || '0', 10)
  const totalTxs = parseInt(txResponse.headers.get('content-range')?.split('/')[1] || '0', 10)

  const avgBlockTime = calculateAvgBlockTime(blocks)

  const successfulTxs = transactions.filter((tx: any) => !tx.error || tx.error === null).length
  const successRate = transactions.length > 0 ? (successfulTxs / transactions.length) * 100 : 100

  const avgGasLimit = calculateAvgGasLimit(transactions)
  const uniqueAddresses = await getUniqueAddresses()

  const latestBlock = blocks[0]
  const activeValidators = getValidatorCountFromBlock(latestBlock)

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

export async function getBlockIntervals(limit = 100): Promise<BlockInterval[]> {
  const cacheKey = `block-intervals-${limit}`
  const cached = cache.get<BlockInterval[]>(cacheKey)
  if (cached) return cached

  const response = await fetch(`${BASE_URL}/blocks_raw?order=id.desc&limit=${limit}`)
  if (!response.ok) return []

  const blocks = await response.json()
  const intervals: BlockInterval[] = []

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

// Convenience functions for common time ranges
export const getTransactionsLastMinute = () => getTransactionsInTimeRange({ value: 1, unit: 'minutes' })
export const getTransactionsLastHour = () => getTransactionsInTimeRange({ value: 1, unit: 'hours' })
export const getTransactionsLastDay = () => getTransactionsInTimeRange({ value: 1, unit: 'days' })
export const getTransactionsLast7Days = () => getTransactionsInTimeRange({ value: 7, unit: 'days' })
