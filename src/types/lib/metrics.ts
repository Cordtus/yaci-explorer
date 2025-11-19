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
