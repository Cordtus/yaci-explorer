import type {
  Block,
  Transaction,
  EnhancedTransaction,
  Message,
  Event,
  PaginatedResponse,
  ChainStats
} from '@/types/blockchain'

export class YaciAPIClient {
  private baseUrl: string
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 10000 // 10 seconds

  /**
   * Creates a new Yaci API client instance
   * @param baseUrl - The PostgREST API base URL. If not provided, uses VITE_POSTGREST_URL from environment
   * @throws {Error} If no baseUrl is provided and VITE_POSTGREST_URL is not set
   */
  constructor(baseUrl?: string) {
    // Use provided baseUrl, or fall back to environment variable
    const url = baseUrl || import.meta.env.VITE_POSTGREST_URL

    if (!url) {
      throw new Error('VITE_POSTGREST_URL environment variable is not set and no baseUrl provided')
    }

    this.baseUrl = url
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T
    }

    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now() })
    return data
  }

  // Block methods
  async getBlocks(limit = 20, offset = 0): Promise<PaginatedResponse<Block>> {
    const response = await fetch(
      `${this.baseUrl}/blocks_raw?limit=${limit}&offset=${offset}&order=id.desc`,
      {
        headers: {
          'Prefer': 'count=exact'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch blocks: ${response.statusText}`)
    }

    const data = await response.json()
    const totalHeader = response.headers.get('Content-Range')
    const total = totalHeader ? parseInt(totalHeader.split('/')[1]) : data.length

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        has_next: offset + limit < total,
        has_prev: offset > 0
      }
    }
  }

  async getBlock(height: number): Promise<Block | null> {
    return this.fetchWithCache(`block:${height}`, async () => {
      const response = await fetch(`${this.baseUrl}/blocks_raw?id=eq.${height}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch block: ${response.statusText}`)
      }
      const blocks = await response.json()
      return blocks[0] || null
    })
  }

  async getLatestBlock(): Promise<Block> {
    const response = await fetch(`${this.baseUrl}/blocks_raw?order=id.desc&limit=1`)
    if (!response.ok) {
      throw new Error(`Failed to fetch latest block: ${response.statusText}`)
    }
    const blocks = await response.json()
    return blocks[0]
  }

  // Transaction methods
  async getTransactions(
    limit = 20,
    offset = 0,
    filters: {
      status?: 'success' | 'failed'
      block_height?: number
      block_height_min?: number
      block_height_max?: number
      timestamp_min?: string
      timestamp_max?: string
      message_type?: string
    } = {}
  ): Promise<PaginatedResponse<EnhancedTransaction>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      order: 'height.desc'
    })

    if (filters.status === 'success') {
      params.append('error', 'is.null')
    } else if (filters.status === 'failed') {
      params.append('error', 'not.is.null')
    }

    // Block height filters
    if (filters.block_height) {
      params.append('height', `eq.${filters.block_height}`)
    } else {
      if (filters.block_height_min) {
        params.append('height', `gte.${filters.block_height_min}`)
      }
      if (filters.block_height_max) {
        params.append('height', `lte.${filters.block_height_max}`)
      }
    }

    // Timestamp filters
    if (filters.timestamp_min) {
      params.append('timestamp', `gte.${filters.timestamp_min}`)
    }
    if (filters.timestamp_max) {
      params.append('timestamp', `lte.${filters.timestamp_max}`)
    }

    const response = await fetch(`${this.baseUrl}/transactions_main?${params}`, {
      headers: {
        'Prefer': 'count=exact'
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }

    const transactions = await response.json()
    const totalHeader = response.headers.get('Content-Range')
    const total = totalHeader ? parseInt(totalHeader.split('/')[1]) : transactions.length

    // Enhance transactions with messages
    const enhanced = await Promise.all(
      transactions.map(async (tx: Transaction) => {
        const [messages, events] = await Promise.all([
          this.getTransactionMessages(tx.id),
          this.getTransactionEvents(tx.id)
        ])

        return {
          ...tx,
          messages,
          events
        } as EnhancedTransaction
      })
    )

    return {
      data: enhanced,
      pagination: {
        total,
        limit,
        offset,
        has_next: offset + limit < total,
        has_prev: offset > 0
      }
    }
  }

  async getTransaction(hash: string): Promise<EnhancedTransaction> {
    const [mainResponse, rawResponse] = await Promise.all([
      fetch(`${this.baseUrl}/transactions_main?id=eq.${hash}`),
      fetch(`${this.baseUrl}/transactions_raw?id=eq.${hash}`)
    ])

    if (!mainResponse.ok || !rawResponse.ok) {
      throw new Error('Failed to fetch transaction')
    }

    const [main, raw] = await Promise.all([
      mainResponse.json(),
      rawResponse.json()
    ])

    const transaction = main[0]
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Decode base64-encoded error field (it's actually log/events data, not an error)
    let actualError = transaction.error
    if (transaction.error && typeof transaction.error === 'string') {
      try {
        // Try to decode as base64
        const decoded = atob(transaction.error)
        const parsed = JSON.parse(decoded)
        // If it successfully parses as JSON, it's not an error but event data
        // Set error to null since the transaction succeeded
        actualError = null
      } catch (e) {
        // If decoding/parsing fails, it's an actual error message, keep it
        actualError = transaction.error
      }
    }

    const [messages, events] = await Promise.all([
      this.getTransactionMessages(hash),
      this.getTransactionEvents(hash)
    ])

    // Check for EVM data
    const evmData = await this.getEVMTransactionData(hash)

    // Add message data from raw transaction for "Show Raw Data" button
    const messagesWithData = messages.map((msg, idx) => ({
      ...msg,
      data: raw[0]?.data?.tx?.body?.messages?.[idx] || msg.metadata
    }))

    return {
      ...transaction,
      error: actualError,
      messages: messagesWithData,
      events,
      evm_data: evmData,
      raw_data: raw[0]?.data
    } as EnhancedTransaction
  }

  private async getTransactionMessages(txHash: string): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/messages_main?id=eq.${txHash}&order=message_index.asc`
    )
    if (!response.ok) {
      return []
    }
    return response.json()
  }

  private async getTransactionEvents(txHash: string): Promise<Event[]> {
    const response = await fetch(
      `${this.baseUrl}/events_main?id=eq.${txHash}&order=event_index.asc,attr_index.asc`
    )
    if (!response.ok) {
      return []
    }
    return response.json()
  }

  /**
   * Fetches all distinct message types from the database
   * @returns Promise resolving to array of distinct message type strings
   */
  async getDistinctMessageTypes(): Promise<string[]> {
    const response = await fetch(
      `${this.baseUrl}/messages_main?select=type&order=type.asc`
    )
    if (!response.ok) {
      return []
    }

    const messages = await response.json()
    const types = new Set<string>()

    messages.forEach((msg: { type: string | null }) => {
      if (msg.type) {
        types.add(msg.type)
      }
    })

    return Array.from(types).sort()
  }

  private async getEVMTransactionData(txHash: string): Promise<any | null> {
    // Check if transaction contains EVM data by looking at message types
    const messages = await this.getTransactionMessages(txHash)
    const hasEVM = messages.some(msg =>
      msg.type?.includes('MsgEthereumTx') ||
      msg.type?.includes('evm')
    )

    if (!hasEVM) {
      return null
    }

    // Parse EVM data from events
    const events = await this.getTransactionEvents(txHash)
    const evmEvents = events.filter(e => e.event_type === 'ethereum_tx')

    if (evmEvents.length === 0) {
      return null
    }

    // Build EVM transaction object from events
    const evmData: any = {}
    evmEvents.forEach(event => {
      switch (event.attr_key) {
        case 'hash':
          evmData.hash = event.attr_value
          break
        case 'from':
          evmData.from_address = event.attr_value
          break
        case 'to':
          evmData.to_address = event.attr_value
          break
        case 'gas_used':
          evmData.gas_used = parseInt(event.attr_value)
          break
        case 'contract_address':
          evmData.contract_address = event.attr_value
          break
      }
    })

    return Object.keys(evmData).length > 0 ? evmData : null
  }

  // Stats methods
  async getChainStats(): Promise<ChainStats> {
    const [latestBlock, recentTxResponse, networkHealth] = await Promise.all([
      this.getLatestBlock(),
      fetch(`${this.baseUrl}/transactions_main?order=height.desc&limit=100`),
      import('@/lib/api/prometheus').then(m => m.getNetworkHealth().catch(() => null))
    ])

    const recentTxs = await recentTxResponse.json()

    // Calculate TPS from recent transactions
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const txsLastMinute = recentTxs.filter((tx: Transaction) =>
      new Date(tx.timestamp).getTime() > oneMinuteAgo
    )

    // Get validator count from Prometheus
    const activeValidators = networkHealth?.validators || 0

    // Calculate average block time from recent blocks
    const blockTimeAnalysis = await this.getBlockTimeAnalysis(100)
    const avgBlockTime = blockTimeAnalysis.avg > 0 ? blockTimeAnalysis.avg : 2.0

    return {
      latest_block: latestBlock.id,
      total_transactions: recentTxs.length,
      avg_block_time: avgBlockTime,
      tps: txsLastMinute.length / 60,
      active_validators: activeValidators,
      total_supply: '0', // Total supply requires gRPC query to bank module
    }
  }

  // Search functionality
  async search(query: string): Promise<any[]> {
    const results = []

    // Try to parse as number for block height
    const blockHeight = parseInt(query)
    if (!isNaN(blockHeight)) {
      try {
        const block = await this.getBlock(blockHeight)
        if (block) {
          results.push({ type: 'block', value: block, score: 100 })
        }
      } catch {}
    }

    // Check if it's a transaction hash (64 chars hex)
    if (query.length === 64 && /^[a-fA-F0-9]+$/.test(query)) {
      try {
        const tx = await this.getTransaction(query)
        if (tx) {
          results.push({ type: 'transaction', value: tx, score: 100 })
        }
      } catch {}
    }

    // Check if it's an address (starts with chain prefix or 0x for EVM)
    if (query.startsWith('manifest') || query.startsWith('0x')) {
      results.push({ type: 'address', value: { address: query }, score: 90 })
    }

    return results
  }

  // WebSocket connection for real-time updates
  createLiveConnection(
    endpoint: string,
    callback: (data: any) => void
  ): EventSource | null {
    if (typeof window === 'undefined') {
      return null
    }

    const eventSource = new EventSource(`${this.baseUrl}/${endpoint}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        callback(data)
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
    }

    return eventSource
  }

  // Analytics methods
  async getTransactionVolumeOverTime(days = 7): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    const response = await fetch(
      `${this.baseUrl}/transactions_main?timestamp=gte.${startDateStr}&order=timestamp.asc`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch transaction volume data')
    }

    const transactions = await response.json()

    // Group by date
    const volumeByDate = new Map<string, number>()
    transactions.forEach((tx: Transaction) => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0]
      volumeByDate.set(date, (volumeByDate.get(date) || 0) + 1)
    })

    return Array.from(volumeByDate.entries()).map(([date, count]) => ({
      date,
      count
    }))
  }

  async getTransactionTypeDistribution(): Promise<Array<{ type: string; count: number }>> {
    const response = await fetch(
      `${this.baseUrl}/messages_main?order=type.asc&limit=10000`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch transaction type data')
    }

    const messages = await response.json()

    // Count by type
    const typeCount = new Map<string, number>()
    messages.forEach((msg: Message) => {
      const type = msg.type || 'Unknown'
      typeCount.set(type, (typeCount.get(type) || 0) + 1)
    })

    return Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  async getHourlyTransactionVolume(hours = 24): Promise<Array<{ hour: string; count: number }>> {
    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hours)
    const startDateStr = startDate.toISOString()

    const response = await fetch(
      `${this.baseUrl}/transactions_main?timestamp=gte.${startDateStr}&order=timestamp.asc`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch hourly transaction data')
    }

    const transactions = await response.json()

    // Group by hour
    const volumeByHour = new Map<string, number>()
    transactions.forEach((tx: Transaction) => {
      const date = new Date(tx.timestamp)
      const hourKey = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`
      volumeByHour.set(hourKey, (volumeByHour.get(hourKey) || 0) + 1)
    })

    return Array.from(volumeByHour.entries()).map(([hour, count]) => ({
      hour,
      count
    }))
  }

  async getBlockTimeAnalysis(limit = 100): Promise<{ avg: number; min: number; max: number }> {
    const response = await fetch(
      `${this.baseUrl}/blocks_raw?order=id.desc&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch block time data')
    }

    const blocks = await response.json()
    const blockTimes: number[] = []

    for (let i = 0; i < blocks.length - 1; i++) {
      const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
      const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
      const diff = (currentTime - previousTime) / 1000 // Convert to seconds
      if (diff > 0 && diff < 100) { // Filter out anomalies
        blockTimes.push(diff)
      }
    }

    if (blockTimes.length === 0) {
      return { avg: 0, min: 0, max: 0 }
    }

    return {
      avg: blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length,
      min: Math.min(...blockTimes),
      max: Math.max(...blockTimes)
    }
  }

  // Fee and Gas Analytics
  async getTotalFeeRevenue(): Promise<Record<string, number>> {
    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=fee&order=height.desc&limit=10000`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch fee revenue data')
    }

    const transactions = await response.json()
    const revenueByDenom: Record<string, number> = {}

    transactions.forEach((tx: any) => {
      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { denom: string; amount: string }) => {
          const amount = parseFloat(coin.amount) || 0
          revenueByDenom[coin.denom] = (revenueByDenom[coin.denom] || 0) + amount
        })
      }
    })

    return revenueByDenom
  }

  async getAverageGasPrice(): Promise<{ denom: string; avgPrice: number }[]> {
    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=fee&order=height.desc&limit=1000`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch gas price data')
    }

    const transactions = await response.json()
    const pricesByDenom: Record<string, { total: number; count: number }> = {}

    transactions.forEach((tx: any) => {
      if (tx.fee?.gasLimit && tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        const gasLimit = parseInt(tx.fee.gasLimit) || 0
        if (gasLimit === 0) return

        tx.fee.amount.forEach((coin: { denom: string; amount: string }) => {
          const amount = parseFloat(coin.amount) || 0
          const gasPrice = amount / gasLimit

          if (!pricesByDenom[coin.denom]) {
            pricesByDenom[coin.denom] = { total: 0, count: 0 }
          }
          pricesByDenom[coin.denom].total += gasPrice
          pricesByDenom[coin.denom].count++
        })
      }
    })

    return Object.entries(pricesByDenom).map(([denom, data]) => ({
      denom,
      avgPrice: data.total / data.count,
    }))
  }

  async getFailedTransactionStats(): Promise<{
    totalFailed: number
    failureRate: number
    topFailureTypes: Array<{ type: string; count: number }>
    failedFees: Record<string, number>
  }> {
    const [failedResponse, totalResponse] = await Promise.all([
      fetch(`${this.baseUrl}/transactions_main?select=fee&error=not.is.null&limit=1000`),
      fetch(`${this.baseUrl}/transactions_main?select=id&limit=1`),
    ])

    if (!failedResponse.ok || !totalResponse.ok) {
      throw new Error('Failed to fetch failed transaction stats')
    }

    const failedTxs = await failedResponse.json()
    const totalHeader = totalResponse.headers.get('Content-Range')
    const totalTransactions = totalHeader ? parseInt(totalHeader.split('/')[1]) : 0

    // Calculate failed fees
    const failedFees: Record<string, number> = {}
    failedTxs.forEach((tx: any) => {
      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { denom: string; amount: string }) => {
          const amount = parseFloat(coin.amount) || 0
          failedFees[coin.denom] = (failedFees[coin.denom] || 0) + amount
        })
      }
    })

    // Get failure types from messages
    const messagesResponse = await fetch(
      `${this.baseUrl}/messages_main?select=type,id&limit=1000`
    )
    const messages = await messagesResponse.json()
    const failuresByType: Record<string, number> = {}

    // Group by transaction to find failed ones
    const txIds = new Set(failedTxs.map((tx: any) => tx.id))
    messages.forEach((msg: any) => {
      if (txIds.has(msg.id)) {
        const type = msg.type || 'Unknown'
        failuresByType[type] = (failuresByType[type] || 0) + 1
      }
    })

    const topFailureTypes = Object.entries(failuresByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalFailed: failedTxs.length,
      failureRate: totalTransactions > 0 ? (failedTxs.length / totalTransactions) * 100 : 0,
      topFailureTypes,
      failedFees,
    }
  }

  async getTransactionCostDistribution(): Promise<
    Array<{ bucket: string; count: number; avgGasLimit: number }>
  > {
    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=fee&order=height.desc&limit=1000`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch transaction cost data')
    }

    const transactions = await response.json()
    const buckets = {
      low: { count: 0, gasLimit: 0 },
      medium: { count: 0, gasLimit: 0 },
      high: { count: 0, gasLimit: 0 },
      veryHigh: { count: 0, gasLimit: 0 },
    }

    transactions.forEach((tx: any) => {
      let totalFee = 0
      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { amount: string }) => {
          totalFee += parseFloat(coin.amount) || 0
        })
      }

      const gasLimit = tx.fee?.gasLimit ? parseInt(tx.fee.gasLimit) : 0
      if (totalFee < 10000) {
        buckets.low.count++
        buckets.low.gasLimit += gasLimit
      } else if (totalFee < 50000) {
        buckets.medium.count++
        buckets.medium.gasLimit += gasLimit
      } else if (totalFee < 100000) {
        buckets.high.count++
        buckets.high.gasLimit += gasLimit
      } else {
        buckets.veryHigh.count++
        buckets.veryHigh.gasLimit += gasLimit
      }
    })

    return [
      {
        bucket: '< 10k',
        count: buckets.low.count,
        avgGasLimit: buckets.low.count > 0 ? buckets.low.gasLimit / buckets.low.count : 0,
      },
      {
        bucket: '10k-50k',
        count: buckets.medium.count,
        avgGasLimit:
          buckets.medium.count > 0 ? buckets.medium.gasLimit / buckets.medium.count : 0,
      },
      {
        bucket: '50k-100k',
        count: buckets.high.count,
        avgGasLimit: buckets.high.count > 0 ? buckets.high.gasLimit / buckets.high.count : 0,
      },
      {
        bucket: '> 100k',
        count: buckets.veryHigh.count,
        avgGasLimit:
          buckets.veryHigh.count > 0 ? buckets.veryHigh.gasLimit / buckets.veryHigh.count : 0,
      },
    ]
  }

  /**
   * Get all unique denominations used in the chain
   * Extracts denoms from fee amounts in transactions
   */
  async getUniqueDenoms(): Promise<string[]> {
    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=fee&limit=10000`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch denominations')
    }

    const transactions = await response.json()
    const denomSet = new Set<string>()

    transactions.forEach((tx: any) => {
      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { denom: string }) => {
          if (coin.denom) {
            denomSet.add(coin.denom)
          }
        })
      }
    })

    return Array.from(denomSet)
  }

  /**
   * Get fee revenue over time grouped by day
   */
  async getFeeRevenueOverTime(days: number = 7): Promise<Array<{ date: string; revenue: Record<string, number> }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=timestamp,fee&timestamp=gte.${startDate.toISOString()}&order=timestamp.asc`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch fee revenue data')
    }

    const transactions = await response.json()
    const revenueByDay: Record<string, Record<string, number>> = {}

    transactions.forEach((tx: any) => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0]
      if (!revenueByDay[date]) {
        revenueByDay[date] = {}
      }

      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { amount: string; denom: string }) => {
          const amount = parseFloat(coin.amount) || 0
          revenueByDay[date][coin.denom] = (revenueByDay[date][coin.denom] || 0) + amount
        })
      }
    })

    return Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }))
  }

  /**
   * Get gas usage distribution across recent transactions
   */
  async getGasUsageDistribution(limit: number = 1000): Promise<Array<{ range: string; count: number }>> {
    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=gas_used&order=height.desc&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch gas usage data')
    }

    const transactions = await response.json()
    const ranges = [
      { min: 0, max: 100000, label: '0-100k' },
      { min: 100000, max: 250000, label: '100k-250k' },
      { min: 250000, max: 500000, label: '250k-500k' },
      { min: 500000, max: 1000000, label: '500k-1M' },
      { min: 1000000, max: Infinity, label: '1M+' },
    ]

    const distribution = ranges.map((range) => ({
      range: range.label,
      count: 0,
    }))

    transactions.forEach((tx: any) => {
      const gasUsed = parseInt(tx.gas_used) || 0
      const rangeIndex = ranges.findIndex((r) => gasUsed >= r.min && gasUsed < r.max)
      if (rangeIndex !== -1) {
        distribution[rangeIndex].count++
      }
    })

    return distribution
  }

  /**
   * Get gas efficiency metrics
   */
  async getGasEfficiency(limit: number = 1000): Promise<{
    avgEfficiency: number
    totalUsed: number
    totalLimit: number
  }> {
    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=gas_used,gas_wanted&order=height.desc&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch gas efficiency data')
    }

    const transactions = await response.json()
    let totalUsed = 0
    let totalLimit = 0

    transactions.forEach((tx: any) => {
      const gasUsed = parseInt(tx.gas_used) || 0
      const gasWanted = parseInt(tx.gas_wanted) || 0
      totalUsed += gasUsed
      totalLimit += gasWanted
    })

    const avgEfficiency = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0

    return {
      avgEfficiency,
      totalUsed,
      totalLimit,
    }
  }

}