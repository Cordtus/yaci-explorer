import type {
  Block,
  Transaction,
  EnhancedTransaction,
  Message,
  Event,
  PaginatedResponse,
  ChainStats
} from './types'

export interface YaciAPIClientOptions {
  cacheTimeout?: number
}

export interface QueryOptions {
  select?: string
  filters?: Record<string, string>
  order?: string
  limit?: number
  offset?: number
  count?: boolean
}

/**
 * PostgREST client for Yaci blockchain indexer
 *
 * Methods are organized into categories:
 * - Core: Base utilities and configuration
 * - Blocks: Block data retrieval
 * - Transactions: Transaction data and filtering
 * - Addresses: Address-specific queries
 * - Analytics: Pre-aggregated statistics (using database views)
 * - Search: Universal search functionality
 */
export class YaciAPIClient {
  private baseUrl: string
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 10000

  // ============================================================================
  // CORE
  // ============================================================================

  constructor(baseUrl: string, options?: YaciAPIClientOptions) {
    if (!baseUrl) {
      throw new Error('baseUrl is required')
    }
    this.baseUrl = baseUrl
    if (options?.cacheTimeout) {
      this.cacheTimeout = options.cacheTimeout
    }
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Generic query method for direct PostgREST access
   * Use this for custom queries or accessing database views
   * @example
   * const stats = await client.query('chain_stats')
   * const volume = await client.query('tx_volume_daily', { limit: 7 })
   */
  async query<T = any>(
    table: string,
    options: QueryOptions = {}
  ): Promise<{ data: T[]; total?: number }> {
    const params = new URLSearchParams()

    if (options.select) params.set('select', options.select)
    if (options.order) params.set('order', options.order)
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.offset) params.set('offset', options.offset.toString())

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.append(key, value)
      })
    }

    const headers: Record<string, string> = {}
    if (options.count) {
      headers['Prefer'] = 'count=exact'
    }

    const response = await fetch(`${this.baseUrl}/${table}?${params}`, { headers })
    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`)
    }

    const data = await response.json()
    let total: number | undefined

    if (options.count) {
      const totalHeader = response.headers.get('Content-Range')
      total = totalHeader ? parseInt(totalHeader.split('/')[1]) : data.length
    }

    return { data, total }
  }

  /**
   * Call a PostgREST RPC function
   * @example
   * const stats = await client.rpc('tx_stats_in_window', { window_minutes: 60 })
   */
  async rpc<T = any>(functionName: string, params: Record<string, any> = {}): Promise<T> {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value))
    })

    const response = await fetch(`${this.baseUrl}/rpc/${functionName}?${queryParams}`)
    if (!response.ok) {
      throw new Error(`RPC call failed: ${response.statusText}`)
    }
    return response.json()
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

  clearCache(): void {
    this.cache.clear()
  }

  // ============================================================================
  // BLOCKS
  // ============================================================================

  async getBlocks(limit = 20, offset = 0): Promise<PaginatedResponse<Block>> {
    const { data, total } = await this.query<Block>('blocks_raw', {
      order: 'id.desc',
      limit,
      offset,
      count: true
    })

    return {
      data,
      pagination: {
        total: total || data.length,
        limit,
        offset,
        has_next: offset + limit < (total || data.length),
        has_prev: offset > 0
      }
    }
  }

  async getBlock(height: number): Promise<Block | null> {
    return this.fetchWithCache(`block:${height}`, async () => {
      const { data } = await this.query<Block>('blocks_raw', {
        filters: { id: `eq.${height}` }
      })
      return data[0] || null
    })
  }

  async getLatestBlock(): Promise<Block> {
    const { data } = await this.query<Block>('blocks_raw', {
      order: 'id.desc',
      limit: 1
    })
    return data[0]
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

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
    const queryFilters: Record<string, string> = {}

    if (filters.status === 'success') {
      queryFilters['error'] = 'is.null'
    } else if (filters.status === 'failed') {
      queryFilters['error'] = 'not.is.null'
    }

    if (filters.block_height) {
      queryFilters['height'] = `eq.${filters.block_height}`
    } else {
      if (filters.block_height_min) {
        queryFilters['height'] = `gte.${filters.block_height_min}`
      }
      if (filters.block_height_max) {
        queryFilters['height'] = `lte.${filters.block_height_max}`
      }
    }

    if (filters.timestamp_min) {
      queryFilters['timestamp'] = `gte.${filters.timestamp_min}`
    }
    if (filters.timestamp_max) {
      queryFilters['timestamp'] = `lte.${filters.timestamp_max}`
    }

    const { data: transactions, total } = await this.query<Transaction>('transactions_main', {
      order: 'height.desc',
      limit,
      offset,
      count: true,
      filters: queryFilters
    })

    // Enhance with messages and events
    const enhanced = await Promise.all(
      transactions.map(async (tx) => {
        const [messages, events] = await Promise.all([
          this.getTransactionMessages(tx.id),
          this.getTransactionEvents(tx.id)
        ])
        return { ...tx, messages, events } as EnhancedTransaction
      })
    )

    return {
      data: enhanced,
      pagination: {
        total: total || transactions.length,
        limit,
        offset,
        has_next: offset + limit < (total || transactions.length),
        has_prev: offset > 0
      }
    }
  }

  async getTransaction(hash: string): Promise<EnhancedTransaction> {
    const [{ data: main }, { data: raw }] = await Promise.all([
      this.query<Transaction>('transactions_main', { filters: { id: `eq.${hash}` } }),
      this.query<any>('transactions_raw', { filters: { id: `eq.${hash}` } })
    ])

    const transaction = main[0]
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Decode base64-encoded error field
    let actualError = transaction.error
    if (transaction.error && typeof transaction.error === 'string') {
      try {
        const decoded = atob(transaction.error)
        JSON.parse(decoded)
        actualError = null
      } catch {
        actualError = transaction.error
      }
    }

    const [messages, events] = await Promise.all([
      this.getTransactionMessages(hash),
      this.getTransactionEvents(hash)
    ])

    const evmData = await this.getEVMTransactionData(hash)

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
    const { data } = await this.query<Message>('messages_main', {
      filters: { id: `eq.${txHash}` },
      order: 'message_index.asc'
    })
    return data
  }

  private async getTransactionEvents(txHash: string): Promise<Event[]> {
    const { data } = await this.query<Event>('events_main', {
      filters: { id: `eq.${txHash}` },
      order: 'event_index.asc,attr_index.asc'
    })
    return data
  }

  private async getEVMTransactionData(txHash: string): Promise<any | null> {
    const messages = await this.getTransactionMessages(txHash)
    const hasEVM = messages.some(msg =>
      msg.type?.includes('MsgEthereumTx') || msg.type?.includes('evm')
    )

    if (!hasEVM) return null

    const events = await this.getTransactionEvents(txHash)
    const evmEvents = events.filter(e => e.event_type === 'ethereum_tx')

    if (evmEvents.length === 0) return null

    const evmData: any = {}
    evmEvents.forEach(event => {
      switch (event.attr_key) {
        case 'hash': evmData.hash = event.attr_value; break
        case 'from': evmData.from_address = event.attr_value; break
        case 'to': evmData.to_address = event.attr_value; break
        case 'gas_used': evmData.gas_used = parseInt(event.attr_value); break
        case 'contract_address': evmData.contract_address = event.attr_value; break
      }
    })

    return Object.keys(evmData).length > 0 ? evmData : null
  }

  // ============================================================================
  // ADDRESSES
  // ============================================================================

  async getTransactionsByAddress(
    address: string,
    limit = 50,
    offset = 0
  ): Promise<PaginatedResponse<EnhancedTransaction>> {
    const { data: messages } = await this.query<Message>('messages_main', {
      filters: { or: `(sender.eq.${address},mentions.cs.%7B${address}%7D)` },
      order: 'id.desc',
      limit: limit * 10
    })

    const txIds = [...new Set(messages.map(msg => msg.id))]

    const transactions = await Promise.all(
      txIds.slice(0, limit).map(async txId => {
        try {
          return await this.getTransaction(txId)
        } catch {
          return null
        }
      })
    )

    const validTransactions = transactions.filter((tx): tx is EnhancedTransaction => tx !== null)

    return {
      data: validTransactions,
      pagination: {
        total: txIds.length,
        limit,
        offset,
        has_next: txIds.length > limit,
        has_prev: offset > 0
      }
    }
  }

  async getAddressStats(address: string): Promise<{
    address: string
    transaction_count: number
    first_seen: string | null
    last_seen: string | null
    total_sent: number
    total_received: number
  }> {
    const { data: messages } = await this.query<Message>('messages_main', {
      filters: { or: `(sender.eq.${address},mentions.cs.%7B${address}%7D)` }
    })

    const uniqueTxIds = new Set(messages.map(msg => msg.id))

    let firstSeen: string | null = null
    let lastSeen: string | null = null

    if (uniqueTxIds.size > 0) {
      const txIds = Array.from(uniqueTxIds).slice(0, 100)
      const idFilters = txIds.map(id => `id.eq.${id}`).join(',')

      const { data: txData } = await this.query<Transaction>('transactions_main', {
        select: 'id,timestamp',
        filters: { or: `(${idFilters})` },
        order: 'timestamp.asc'
      })

      if (txData.length > 0) {
        firstSeen = txData[0].timestamp
        lastSeen = txData[txData.length - 1].timestamp
      }
    }

    let sentCount = 0
    let receivedCount = 0
    messages.forEach(msg => {
      if (msg.sender === address) sentCount++
      else receivedCount++
    })

    return {
      address,
      transaction_count: uniqueTxIds.size,
      first_seen: firstSeen,
      last_seen: lastSeen,
      total_sent: sentCount,
      total_received: receivedCount
    }
  }

  // ============================================================================
  // ANALYTICS (Using Database Views)
  // ============================================================================

  /**
   * Get chain statistics from pre-aggregated view
   * Requires: api.chain_stats view
   */
  async getChainStats(): Promise<ChainStats> {
    try {
      // Try to use the database view first
      const { data } = await this.query<any>('chain_stats', { limit: 1 })
      if (data.length > 0) {
        const stats = data[0]
        const blockTimeAnalysis = await this.getBlockTimeAnalysis(100)

        return {
          latest_block: stats.latest_block || 0,
          total_transactions: stats.total_transactions || 0,
          avg_block_time: blockTimeAnalysis.avg,
          tps: 0, // Calculate separately if needed
          active_validators: 0, // Requires block data
          total_supply: '0'
        }
      }
    } catch {
      // Fall back to manual calculation
    }

    // Fallback: manual calculation
    const [latestBlock, txResponse] = await Promise.all([
      this.getLatestBlock(),
      this.query<Transaction>('transactions_main', {
        select: 'id',
        limit: 1,
        count: true
      })
    ])

    const blockTimeAnalysis = await this.getBlockTimeAnalysis(100)
    const activeValidators =
      latestBlock?.data?.block?.last_commit?.signatures?.length ||
      latestBlock?.data?.block?.lastCommit?.signatures?.length || 0

    return {
      latest_block: latestBlock?.id || 0,
      total_transactions: txResponse.total || 0,
      avg_block_time: blockTimeAnalysis.avg,
      tps: 0,
      active_validators: activeValidators,
      total_supply: '0'
    }
  }

  /**
   * Get daily transaction volume
   * Requires: api.tx_volume_daily view
   */
  async getTransactionVolumeDaily(days = 30): Promise<Array<{ date: string; count: number }>> {
    try {
      const { data } = await this.query<{ date: string; count: number }>('tx_volume_daily', {
        limit: days,
        order: 'date.desc'
      })
      return data.reverse()
    } catch {
      // Fallback to client-side aggregation
      return this.getTransactionVolumeOverTime(days)
    }
  }

  /**
   * Get hourly transaction volume
   * Requires: api.tx_volume_hourly view
   */
  async getTransactionVolumeHourly(hours = 24): Promise<Array<{ hour: string; count: number }>> {
    try {
      const { data } = await this.query<{ hour: string; count: number }>('tx_volume_hourly', {
        limit: hours,
        order: 'hour.desc'
      })
      return data.reverse()
    } catch {
      return this.getHourlyTransactionVolume(hours)
    }
  }

  /**
   * Get message type distribution
   * Requires: api.message_type_stats view
   */
  async getMessageTypeStats(): Promise<Array<{ type: string; count: number }>> {
    try {
      const { data } = await this.query<{ type: string; count: number }>('message_type_stats')
      return data
    } catch {
      return this.getTransactionTypeDistribution()
    }
  }

  /**
   * Get fee revenue by denomination
   * Requires: api.fee_revenue view
   */
  async getFeeRevenue(): Promise<Array<{ denom: string; total_amount: number }>> {
    try {
      const { data } = await this.query<{ denom: string; total_amount: number }>('fee_revenue')
      return data
    } catch {
      // Fallback
      const revenue = await this.getTotalFeeRevenue()
      return Object.entries(revenue).map(([denom, total_amount]) => ({ denom, total_amount }))
    }
  }

  /**
   * Get block time statistics
   * Requires: api.block_time_stats view
   */
  async getBlockTimeStats(): Promise<{ avg_block_time: number; min_block_time: number; max_block_time: number }> {
    try {
      const { data } = await this.query<any>('block_time_stats', { limit: 1 })
      if (data.length > 0) return data[0]
    } catch {
      // Fallback
    }
    const analysis = await this.getBlockTimeAnalysis(100)
    return {
      avg_block_time: analysis.avg,
      min_block_time: analysis.min,
      max_block_time: analysis.max
    }
  }

  /**
   * Get gas usage distribution
   * Requires: api.gas_usage_distribution view
   */
  async getGasDistribution(): Promise<Array<{ range: string; count: number }>> {
    try {
      const { data } = await this.query<{ range: string; count: number }>('gas_usage_distribution')
      return data
    } catch {
      return this.getGasUsageDistribution(1000)
    }
  }

  /**
   * Get transaction success rate
   * Requires: api.tx_success_rate view
   */
  async getSuccessRate(): Promise<{
    total: number
    successful: number
    failed: number
    success_rate_percent: number
  }> {
    try {
      const { data } = await this.query<any>('tx_success_rate', { limit: 1 })
      if (data.length > 0) return data[0]
    } catch {
      // Fallback
    }

    const stats = await this.getFailedTransactionStats()
    return {
      total: stats.totalFailed + Math.round(stats.totalFailed / (stats.failureRate / 100) - stats.totalFailed),
      successful: 0,
      failed: stats.totalFailed,
      success_rate_percent: 100 - stats.failureRate
    }
  }

  /**
   * Get transaction stats for a time window
   * Requires: api.tx_stats_in_window function
   */
  async getStatsInWindow(windowMinutes = 60): Promise<{
    tx_count: number
    avg_gas_used: number
    success_rate: number
  }> {
    return this.rpc('tx_stats_in_window', { window_minutes: windowMinutes })
  }

  /**
   * Get transaction count in time range
   * Requires: api.tx_count_in_range function
   */
  async getCountInRange(options: { minutes?: number; hours?: number; days?: number }): Promise<number> {
    const result = await this.rpc<number>('tx_count_in_range', options)
    return result
  }

  // ============================================================================
  // ANALYTICS (Fallback Methods - Client-side aggregation)
  // ============================================================================

  async getBlockTimeAnalysis(limit = 100): Promise<{ avg: number; min: number; max: number }> {
    const { data: blocks } = await this.query<Block>('blocks_raw', {
      order: 'id.desc',
      limit
    })

    const blockTimes: number[] = []
    for (let i = 0; i < blocks.length - 1; i++) {
      const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
      const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
      const diff = (currentTime - previousTime) / 1000
      if (diff > 0 && diff < 100) {
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

  // Legacy methods for backward compatibility
  async getTransactionVolumeOverTime(days = 7): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: transactions } = await this.query<Transaction>('transactions_main', {
      filters: { timestamp: `gte.${startDate.toISOString()}` },
      order: 'timestamp.asc'
    })

    const volumeByDate = new Map<string, number>()
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0]
      volumeByDate.set(date, (volumeByDate.get(date) || 0) + 1)
    })

    return Array.from(volumeByDate.entries()).map(([date, count]) => ({ date, count }))
  }

  async getTransactionTypeDistribution(): Promise<Array<{ type: string; count: number }>> {
    const { data: messages } = await this.query<Message>('messages_main', {
      order: 'type.asc',
      limit: 10000
    })

    const typeCount = new Map<string, number>()
    messages.forEach(msg => {
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

    const { data: transactions } = await this.query<Transaction>('transactions_main', {
      filters: { timestamp: `gte.${startDate.toISOString()}` },
      order: 'timestamp.asc'
    })

    const volumeByHour = new Map<string, number>()
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp)
      const hourKey = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`
      volumeByHour.set(hourKey, (volumeByHour.get(hourKey) || 0) + 1)
    })

    return Array.from(volumeByHour.entries()).map(([hour, count]) => ({ hour, count }))
  }

  async getTotalFeeRevenue(): Promise<Record<string, number>> {
    const { data: transactions } = await this.query<any>('transactions_main', {
      select: 'fee',
      order: 'height.desc',
      limit: 10000
    })

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

  async getFeeRevenueOverTime(days = 7): Promise<Array<{ date: string; revenue: Record<string, number> }>> {
    const { data: transactions } = await this.query<any>('transactions_main', {
      select: 'fee,timestamp',
      order: 'height.desc',
      limit: 10000
    })

    const revenueByDate: Record<string, Record<string, number>> = {}
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    transactions.forEach((tx: any) => {
      if (!tx.timestamp || !tx.fee?.amount) return

      const txDate = new Date(tx.timestamp)
      if (txDate < cutoffDate) return

      const dateKey = txDate.toISOString().split('T')[0]

      if (!revenueByDate[dateKey]) {
        revenueByDate[dateKey] = {}
      }

      if (Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { denom: string; amount: string }) => {
          const amount = parseFloat(coin.amount) || 0
          revenueByDate[dateKey][coin.denom] = (revenueByDate[dateKey][coin.denom] || 0) + amount
        })
      }
    })

    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async getFailedTransactionStats(): Promise<{
    totalFailed: number
    failureRate: number
    topFailureTypes: Array<{ type: string; count: number }>
    failedFees: Record<string, number>
  }> {
    const [{ data: failedTxs }, { total }] = await Promise.all([
      this.query<any>('transactions_main', {
        select: 'fee',
        filters: { error: 'not.is.null' },
        limit: 1000
      }),
      this.query<any>('transactions_main', {
        select: 'id',
        limit: 1,
        count: true
      })
    ])

    const failedFees: Record<string, number> = {}
    failedTxs.forEach((tx: any) => {
      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { denom: string; amount: string }) => {
          const amount = parseFloat(coin.amount) || 0
          failedFees[coin.denom] = (failedFees[coin.denom] || 0) + amount
        })
      }
    })

    return {
      totalFailed: failedTxs.length,
      failureRate: (total || 0) > 0 ? (failedTxs.length / (total || 1)) * 100 : 0,
      topFailureTypes: [],
      failedFees
    }
  }

  async getGasUsageDistribution(limit = 1000): Promise<Array<{ range: string; count: number }>> {
    const { data: transactions } = await this.query<any>('transactions_main', {
      select: 'gas_used',
      order: 'height.desc',
      limit
    })

    const ranges = [
      { min: 0, max: 100000, label: '0-100k' },
      { min: 100000, max: 250000, label: '100k-250k' },
      { min: 250000, max: 500000, label: '250k-500k' },
      { min: 500000, max: 1000000, label: '500k-1M' },
      { min: 1000000, max: Infinity, label: '1M+' }
    ]

    const distribution = ranges.map(range => ({ range: range.label, count: 0 }))

    transactions.forEach((tx: any) => {
      const gasUsed = parseInt(tx.gas_used) || 0
      const rangeIndex = ranges.findIndex(r => gasUsed >= r.min && gasUsed < r.max)
      if (rangeIndex !== -1) {
        distribution[rangeIndex].count++
      }
    })

    return distribution
  }

  async getGasEfficiency(limit = 1000): Promise<{ avgGasLimit: number; totalGasLimit: number; transactionCount: number }> {
    const { data: transactions } = await this.query<any>('transactions_main', {
      select: 'gas_wanted',
      order: 'height.desc',
      limit
    })

    if (transactions.length === 0) {
      return { avgGasLimit: 0, totalGasLimit: 0, transactionCount: 0 }
    }

    const totalGas = transactions.reduce((sum: number, tx: any) => {
      return sum + (parseInt(tx.gas_wanted) || 0)
    }, 0)

    return {
      avgGasLimit: Math.round(totalGas / transactions.length),
      totalGasLimit: totalGas,
      transactionCount: transactions.length
    }
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  async search(query: string): Promise<any[]> {
    const results = []
    const trimmedQuery = query.trim()

    // Block height
    const blockHeight = parseInt(trimmedQuery)
    if (!isNaN(blockHeight) && trimmedQuery === blockHeight.toString()) {
      try {
        const block = await this.getBlock(blockHeight)
        if (block) {
          results.push({ type: 'block', value: block, score: 100 })
        }
      } catch {}
    }

    // Transaction hash (64 chars hex)
    if (trimmedQuery.length === 64 && /^[a-fA-F0-9]+$/.test(trimmedQuery)) {
      try {
        const tx = await this.getTransaction(trimmedQuery)
        if (tx) {
          results.push({ type: 'transaction', value: tx, score: 100 })
        }
      } catch {}
    }

    // Address patterns
    const isBech32Address = /^[a-z]+1[a-z0-9]{38,}$/i.test(trimmedQuery)
    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmedQuery)
    const isValidatorAddress = /^[a-z]+valoper1[a-z0-9]{38,}$/i.test(trimmedQuery)

    if (isBech32Address || isEthAddress || isValidatorAddress) {
      try {
        const stats = await this.getAddressStats(trimmedQuery)
        if (stats.transaction_count > 0) {
          results.push({ type: 'address', value: { address: trimmedQuery }, score: 90 })
        }
      } catch {
        results.push({ type: 'address', value: { address: trimmedQuery }, score: 80 })
      }
    }

    return results
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  async getDistinctMessageTypes(): Promise<string[]> {
    const { data: messages } = await this.query<{ type: string | null }>('messages_main', {
      select: 'type',
      order: 'type.asc'
    })

    const types = new Set<string>()
    messages.forEach(msg => {
      if (msg.type) types.add(msg.type)
    })

    return Array.from(types).sort()
  }

  createLiveConnection(
    endpoint: string,
    callback: (data: any) => void
  ): EventSource | null {
    if (typeof window === 'undefined') return null

    const eventSource = new EventSource(`${this.baseUrl}/${endpoint}`)

    eventSource.onmessage = (event) => {
      try {
        callback(JSON.parse(event.data))
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
    }

    return eventSource
  }
}
