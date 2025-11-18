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

  /**
   * Fetches a paginated list of blocks from the blockchain
   * @param limit - Maximum number of blocks to return (default: 20)
   * @param offset - Number of blocks to skip for pagination (default: 0)
   * @returns Promise resolving to paginated response containing blocks
   * @throws {Error} If the API request fails
   * @example
   * const result = await client.getBlocks(10, 0);
   * console.log(`Retrieved ${result.data.length} of ${result.pagination.total} blocks`);
   */
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

  /**
   * Fetches a specific block by its height with caching
   * @param height - The block height to fetch
   * @returns Promise resolving to the block or null if not found
   * @throws {Error} If the API request fails
   * @example
   * const block = await client.getBlock(12345);
   * if (block) console.log(`Block time: ${block.data.block.header.time}`);
   */
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

  /**
   * Fetches the most recent block from the blockchain
   * @returns Promise resolving to the latest block
   * @throws {Error} If the API request fails or no blocks exist
   * @example
   * const latest = await client.getLatestBlock();
   * console.log(`Current height: ${latest.id}`);
   */
  async getLatestBlock(): Promise<Block> {
    const response = await fetch(`${this.baseUrl}/blocks_raw?order=id.desc&limit=1`)
    if (!response.ok) {
      throw new Error(`Failed to fetch latest block: ${response.statusText}`)
    }
    const blocks = await response.json()
    return blocks[0]
  }

  // Transaction methods

  /**
   * Fetches a paginated list of transactions with optional filters
   * @param limit - Maximum number of transactions to return (default: 20)
   * @param offset - Number of transactions to skip for pagination (default: 0)
   * @param filters - Optional filters for status, block height, timestamp, and message type
   * @returns Promise resolving to paginated response containing enhanced transactions with messages and events
   * @throws {Error} If the API request fails
   * @example
   * const txs = await client.getTransactions(10, 0, { status: 'success', block_height: 12345 });
   * txs.data.forEach(tx => console.log(tx.id, tx.messages.length));
   */
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

  /**
   * Fetches a single transaction by hash with full details including messages, events, and EVM data
   * @param hash - The transaction hash (64 character hex string)
   * @returns Promise resolving to enhanced transaction with all related data
   * @throws {Error} If the API request fails or transaction is not found
   * @example
   * const tx = await client.getTransaction('A1B2C3...');
   * console.log(`Gas used: ${tx.gas_used}, Messages: ${tx.messages.length}`);
   */
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

  // Address methods

  /**
   * Fetches transactions associated with a specific address
   * Searches both sender field and mentions array in messages_main table
   * @param address - The blockchain address to search for (e.g., 'manifest1...' or '0x...')
   * @param limit - Maximum number of transactions to return (default: 50)
   * @param offset - Number of transactions to skip for pagination (default: 0)
   * @returns Promise resolving to paginated response of transactions involving the address
   * @throws {Error} If the API request fails
   * @example
   * const txs = await client.getTransactionsByAddress('manifest1abc...', 20, 0);
   * console.log(`Address has ${txs.pagination.total} transactions`);
   */
  async getTransactionsByAddress(
    address: string,
    limit = 50,
    offset = 0
  ): Promise<PaginatedResponse<EnhancedTransaction>> {
    // Query messages_main to find transactions where address is sender or mentioned
    const params = new URLSearchParams({
      limit: (limit * 10).toString(), // Get more messages to ensure we have enough unique transactions
      offset: offset.toString(),
      order: 'id.desc'
    })

    // Use PostgREST's OR syntax to search both sender and mentions array
    // Format: or=(sender.eq.address,mentions.cs.%7Baddress%7D)
    // cs = contains (for array containment check)
    // Note: Braces must be URL-encoded (%7B = {, %7D = }) for PostgreSQL text array syntax
    params.append('or', `(sender.eq.${address},mentions.cs.%7B${address}%7D)`)

    const response = await fetch(`${this.baseUrl}/messages_main?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch transactions for address')
    }

    const messages = await response.json()

    // Get unique transaction IDs
    const txIds = [...new Set(messages.map((msg: Message) => msg.id))]

    // Fetch full transaction details for each unique tx
    const transactions = await Promise.all(
      txIds.slice(0, limit).map(async (txId: string) => {
        try {
          return await this.getTransaction(txId)
        } catch (error) {
          console.error(`Failed to fetch transaction ${txId}:`, error)
          return null
        }
      })
    )

    // Filter out any failed fetches
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

  /**
   * Gets statistics and summary information for a specific address
   * @param address - The blockchain address to get statistics for
   * @returns Promise resolving to address statistics including transaction count and timestamps
   * @throws {Error} If the API request fails
   * @example
   * const stats = await client.getAddressStats('manifest1abc...');
   * console.log(`First seen: ${stats.first_seen}, Total txs: ${stats.transaction_count}`);
   */
  async getAddressStats(address: string): Promise<{
    address: string
    transaction_count: number
    first_seen: string | null
    last_seen: string | null
    total_sent: number
    total_received: number
  }> {
    // Get all messages involving this address
    // Note: Braces must be URL-encoded for PostgreSQL text array syntax
    const params = new URLSearchParams({
      or: `(sender.eq.${address},mentions.cs.%7B${address}%7D)`,
      order: 'id.desc'
    })

    const response = await fetch(`${this.baseUrl}/messages_main?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch address statistics')
    }

    const messages = await response.json()

    // Count unique transactions
    const uniqueTxIds = new Set(messages.map((msg: Message) => msg.id))

    // Get timestamps from transactions
    let firstSeen: string | null = null
    let lastSeen: string | null = null
    let sentCount = 0
    let receivedCount = 0

    if (uniqueTxIds.size > 0) {
      // Fetch transaction timestamps
      const txIds = Array.from(uniqueTxIds).slice(0, 100) // Limit to 100 for performance
      const txParams = new URLSearchParams({
        select: 'id,timestamp',
        order: 'timestamp.asc'
      })

      // Build OR clause for transaction IDs
      const idFilters = txIds.map(id => `id.eq.${id}`).join(',')
      txParams.append('or', `(${idFilters})`)

      const txResponse = await fetch(`${this.baseUrl}/transactions_main?${txParams}`)
      if (txResponse.ok) {
        const txData = await txResponse.json()
        if (txData.length > 0) {
          firstSeen = txData[0].timestamp
          lastSeen = txData[txData.length - 1].timestamp
        }
      }
    }

    // Count sent vs received (sent = where address is sender)
    messages.forEach((msg: Message) => {
      if (msg.sender === address) {
        sentCount++
      } else {
        receivedCount++
      }
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

  /**
   * Fetches comprehensive chain statistics including latest block, TPS, and validator count
   * @returns Promise resolving to chain statistics object
   * @throws {Error} If the API request fails
   * @example
   * const stats = await client.getChainStats();
   * console.log(`Latest block: ${stats.latest_block}, TPS: ${stats.tps.toFixed(2)}`);
   */
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

    // Get validator count from Prometheus, fallback to block data
    let activeValidators = networkHealth?.validators || 0

    // If Prometheus doesn't have validator count, get from latest block
    if (activeValidators === 0) {
      activeValidators =
        latestBlock?.data?.block?.last_commit?.signatures?.length ||
        latestBlock?.data?.block?.lastCommit?.signatures?.length ||
        latestBlock?.data?.lastCommit?.signatures?.length ||
        0
    }

    // Calculate average block time from recent blocks
    const blockTimeAnalysis = await this.getBlockTimeAnalysis(100)
    const avgBlockTime = blockTimeAnalysis.avg > 0 ? blockTimeAnalysis.avg : 2.0

    // Get actual total transaction count from the database
    const totalTxResponse = await fetch(
      `${this.baseUrl}/transactions_main?select=id&limit=1`,
      {
        headers: {
          'Prefer': 'count=exact'
        }
      }
    )

    let totalTransactions = 0
    if (totalTxResponse.ok) {
      const totalHeader = totalTxResponse.headers.get('Content-Range')
      totalTransactions = totalHeader ? parseInt(totalHeader.split('/')[1]) : 0
    }

    return {
      latest_block: latestBlock.id,
      total_transactions: totalTransactions,
      avg_block_time: avgBlockTime,
      tps: txsLastMinute.length / 60,
      active_validators: activeValidators,
      total_supply: '0', // Total supply requires gRPC query to bank module
    }
  }

  // Search functionality

  /**
   * Universal search function that detects and searches for blocks, transactions, or addresses
   * Automatically determines the query type and returns appropriate results
   * @param query - Search query (block height, tx hash, or address)
   * @returns Promise resolving to array of search results with type and score
   * @example
   * const results = await client.search('12345'); // Block height
   * const results = await client.search('A1B2C3...'); // Transaction hash
   * const results = await client.search('manifest1...'); // Address
   */
  async search(query: string): Promise<any[]> {
    const results = []
    const trimmedQuery = query.trim()

    // Try to parse as number for block height
    const blockHeight = parseInt(trimmedQuery)
    if (!isNaN(blockHeight) && trimmedQuery === blockHeight.toString()) {
      try {
        const block = await this.getBlock(blockHeight)
        if (block) {
          results.push({ type: 'block', value: block, score: 100 })
        }
      } catch {}
    }

    // Check if it's a transaction hash (64 chars hex)
    if (trimmedQuery.length === 64 && /^[a-fA-F0-9]+$/.test(trimmedQuery)) {
      try {
        const tx = await this.getTransaction(trimmedQuery)
        if (tx) {
          results.push({ type: 'transaction', value: tx, score: 100 })
        }
      } catch {}
    }

    // Check if it's an address
    // Cosmos bech32 addresses (e.g., cosmos1..., manifest1..., osmo1...)
    // Ethereum addresses (0x... with 40 hex chars)
    // Validator addresses (cosmosvaloper1..., manifestvaloper1...)
    const isBech32Address = /^[a-z]+1[a-z0-9]{38,}$/i.test(trimmedQuery)
    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmedQuery)
    const isValidatorAddress = /^[a-z]+valoper1[a-z0-9]{38,}$/i.test(trimmedQuery)

    if (isBech32Address || isEthAddress || isValidatorAddress) {
      // Verify the address has transactions before returning
      try {
        const stats = await this.getAddressStats(trimmedQuery)
        if (stats.transaction_count > 0) {
          results.push({ type: 'address', value: { address: trimmedQuery }, score: 90 })
        }
      } catch {
        // Even if stats fail, still include the address as a result
        results.push({ type: 'address', value: { address: trimmedQuery }, score: 80 })
      }
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

  /**
   * Fetches transaction volume grouped by date over a specified time period
   * @param days - Number of days to look back (default: 7)
   * @returns Promise resolving to array of date/count pairs
   * @throws {Error} If the API request fails
   * @example
   * const volume = await client.getTransactionVolumeOverTime(30);
   * volume.forEach(d => console.log(`${d.date}: ${d.count} txs`));
   */
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

  /**
   * Fetches distribution of transaction types across all messages
   * Returns top 10 most common message types with their counts
   * @returns Promise resolving to array of type/count pairs sorted by count descending
   * @throws {Error} If the API request fails
   * @example
   * const dist = await client.getTransactionTypeDistribution();
   * console.log(`Most common: ${dist[0].type} (${dist[0].count} messages)`);
   */
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

  /**
   * Analyzes block time statistics from recent blocks
   * @param limit - Number of recent blocks to analyze (default: 100)
   * @returns Promise resolving to average, min, and max block times in seconds
   * @throws {Error} If the API request fails
   * @example
   * const analysis = await client.getBlockTimeAnalysis(100);
   * console.log(`Avg: ${analysis.avg.toFixed(2)}s, Range: ${analysis.min}-${analysis.max}s`);
   */
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
   * Get gas limit metrics from recent transactions
   * Note: gas_used is not available in transactions_main, only gas limit (fee.gasLimit)
   */
  async getGasEfficiency(limit: number = 1000): Promise<{
    avgGasLimit: number
    totalGasLimit: number
    transactionCount: number
  }> {
    const response = await fetch(
      `${this.baseUrl}/transactions_main?select=fee&order=height.desc&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch gas data')
    }

    const transactions = await response.json()
    let totalGasLimit = 0
    let transactionCount = 0

    transactions.forEach((tx: any) => {
      if (tx.fee?.gasLimit) {
        const gasLimit = parseInt(tx.fee.gasLimit) || 0
        totalGasLimit += gasLimit
        transactionCount++
      }
    })

    const avgGasLimit = transactionCount > 0 ? totalGasLimit / transactionCount : 0

    return {
      avgGasLimit,
      totalGasLimit,
      transactionCount,
    }
  }

}