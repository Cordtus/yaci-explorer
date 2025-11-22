import type {
  Block,
  Transaction,
  EnhancedTransaction,
  Message,
  Event,
  PaginatedResponse,
  ChainStats,
  EvmTxMap,
  EvmAddressActivity
} from './types'
import { Transaction as EthersTransaction, Interface, AbiCoder } from 'ethers'

// Common ERC-20/ERC-721 function signatures
const COMMON_SIGNATURES: Record<string, { name: string; params: string[] }> = {
  '0xa9059cbb': { name: 'transfer', params: ['address to', 'uint256 amount'] },
  '0x23b872dd': { name: 'transferFrom', params: ['address from', 'address to', 'uint256 amount'] },
  '0x095ea7b3': { name: 'approve', params: ['address spender', 'uint256 amount'] },
  '0x70a08231': { name: 'balanceOf', params: ['address account'] },
  '0xdd62ed3e': { name: 'allowance', params: ['address owner', 'address spender'] },
  '0x18160ddd': { name: 'totalSupply', params: [] },
  '0x313ce567': { name: 'decimals', params: [] },
  '0x06fdde03': { name: 'name', params: [] },
  '0x95d89b41': { name: 'symbol', params: [] },
  '0x40c10f19': { name: 'mint', params: ['address to', 'uint256 amount'] },
  '0x42966c68': { name: 'burn', params: ['uint256 amount'] },
  '0x79cc6790': { name: 'burnFrom', params: ['address from', 'uint256 amount'] },
  '0xa457c2d7': { name: 'decreaseAllowance', params: ['address spender', 'uint256 subtractedValue'] },
  '0x39509351': { name: 'increaseAllowance', params: ['address spender', 'uint256 addedValue'] },
  '0x6352211e': { name: 'ownerOf', params: ['uint256 tokenId'] },
  '0x42842e0e': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 tokenId'] },
  '0xb88d4fde': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 tokenId', 'bytes data'] },
  '0xa22cb465': { name: 'setApprovalForAll', params: ['address operator', 'bool approved'] },
  '0xe985e9c5': { name: 'isApprovedForAll', params: ['address owner', 'address operator'] },
  '0x081812fc': { name: 'getApproved', params: ['uint256 tokenId'] },
  '0xc87b56dd': { name: 'tokenURI', params: ['uint256 tokenId'] },
  '0xd0e30db0': { name: 'deposit', params: [] },
  '0x2e1a7d4d': { name: 'withdraw', params: ['uint256 amount'] },
  '0x': { name: 'Native Transfer', params: [] },
}

// Decode function input data
function decodeInputData(inputData: string): { methodId: string; methodName: string; params: Array<{ name: string; type: string; value: any }> } | null {
  if (!inputData || inputData === '0x' || inputData.length < 10) {
    return inputData === '0x' || !inputData
      ? { methodId: '0x', methodName: 'Native Transfer', params: [] }
      : null
  }

  const methodId = inputData.slice(0, 10).toLowerCase()
  const sig = COMMON_SIGNATURES[methodId]

  if (!sig) {
    return { methodId, methodName: 'Unknown', params: [] }
  }

  const params: Array<{ name: string; type: string; value: any }> = []

  if (sig.params.length > 0 && inputData.length > 10) {
    try {
      const types = sig.params.map(p => p.split(' ')[0])
      const abiCoder = new AbiCoder()
      const decoded = abiCoder.decode(types, '0x' + inputData.slice(10))

      sig.params.forEach((param, idx) => {
        const [type, name] = param.split(' ')
        let value = decoded[idx]

        // Format bigints as strings
        if (typeof value === 'bigint') {
          value = value.toString()
        }

        params.push({ name: name || `param${idx}`, type, value })
      })
    } catch {
      // Decoding failed, return without params
    }
  }

  return { methodId, methodName: sig.name, params }
}

export interface TransactionFilters {
  status?: 'success' | 'failed'
  block_height?: number
  block_height_min?: number
  block_height_max?: number
  timestamp_min?: string
  timestamp_max?: string
  message_type?: string
}

export interface YaciAPIClientOptions {
  cacheTimeout?: number
  defaultPageSize?: number
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
    // If filtering by message_type, get tx IDs from messages_main first
    let txIdFilter: string[] | null = null
    if (filters.message_type) {
      const { data: messages } = await this.query<Message>('messages_main', {
        select: 'id',
        filters: { type: `eq.${filters.message_type}` },
        order: 'id.desc'
      })
      txIdFilter = [...new Set(messages.map(m => m.id))]
      if (txIdFilter.length === 0) {
        return {
          data: [],
          pagination: { total: 0, limit, offset, has_next: false, has_prev: offset > 0 }
        }
      }
    }

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

    // Apply message_type filter via tx IDs
    if (txIdFilter) {
      const idFilters = txIdFilter.map(id => `id.eq.${id}`).join(',')
      queryFilters['or'] = `(${idFilters})`
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

    const rawTx = raw[0]
    const transaction = main[0]

    // Check for ingest error
    const rawErrorData = rawTx?.data && typeof rawTx.data === 'object' && 'error' in rawTx.data
      ? rawTx.data
      : null
    const ingestError = !transaction && rawErrorData
      ? {
          message: rawErrorData.error,
          reason: rawErrorData.reason ?? null,
          hash: rawErrorData.hash ?? hash
        }
      : null

    if (!transaction) {
      if (ingestError) {
        return {
          id: rawTx?.id || hash,
          fee: null as any,
          memo: null,
          error: ingestError.reason
            ? `${ingestError.message}: ${ingestError.reason}`
            : ingestError.message,
          height: rawErrorData?.height ? Number(rawErrorData.height) : null as any,
          timestamp: rawErrorData?.timestamp ?? null as any,
          proposal_ids: null,
          ingest_error: ingestError,
          messages: [],
          events: [],
          raw_data: rawTx?.data
        } as EnhancedTransaction
      }
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

    const evmData = await this.getEVMTransactionData(hash, rawTx, !actualError)

    const messagesWithData = messages.map((msg, idx) => ({
      ...msg,
      data: rawTx?.data?.tx?.body?.messages?.[idx] || msg.metadata
    }))

    return {
      ...transaction,
      error: actualError,
      ingest_error: null,
      messages: messagesWithData,
      events,
      evm_data: evmData,
      raw_data: rawTx?.data
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

  private async getEVMTransactionData(txHash: string, rawTx?: any, isSuccess?: boolean): Promise<any | null> {
    const messages = await this.getTransactionMessages(txHash)
    const hasEVM = messages.some(msg =>
      msg.type?.includes('MsgEthereumTx') || msg.type?.includes('evm')
    )

    if (!hasEVM) return null

    const events = await this.getTransactionEvents(txHash)
    const evmEvents = events.filter(e => e.event_type === 'ethereum_tx')

    let gasUsed: number | undefined
    let ethereumHashFromEvent: string | undefined
    let toFromEvent: string | null | undefined
    let senderFromEvent: string | undefined
    let amountFromEvent: string | undefined
    let txTypeFromEvent: number | undefined

    evmEvents.forEach((event) => {
      switch (event.attr_key) {
        case 'txGasUsed':
          if (event.attr_value) {
            const parsed = parseInt(event.attr_value, 10)
            if (!Number.isNaN(parsed)) gasUsed = parsed
          }
          break
        case 'ethereumTxHash':
          ethereumHashFromEvent = event.attr_value
          break
        case 'recipient':
          toFromEvent = event.attr_value
          break
        case 'sender':
          senderFromEvent = event.attr_value
          break
        case 'amount':
          amountFromEvent = event.attr_value
          break
        case 'txType':
          if (event.attr_value) {
            const parsed = parseInt(event.attr_value, 10)
            if (!Number.isNaN(parsed)) txTypeFromEvent = parsed
          }
          break
      }
    })

    // Parse raw Ethereum transaction bytes from MsgEthereumTx
    let parsedTx: EthersTransaction | null = null
    const rawMessages = rawTx?.data?.tx?.body?.messages
    if (Array.isArray(rawMessages)) {
      const ethMsg = rawMessages.find(
        (m: any) => m?.['@type'] === '/cosmos.evm.vm.v1.MsgEthereumTx'
      )
      const rawHex: string | undefined = ethMsg?.raw || ethMsg?.value?.raw
      if (rawHex && typeof rawHex === 'string') {
        try {
          parsedTx = EthersTransaction.from(rawHex)
        } catch {
          parsedTx = null
        }
      }
    }

    if (!parsedTx && !ethereumHashFromEvent && typeof gasUsed === 'undefined') {
      return null
    }

    const hash = ethereumHashFromEvent || parsedTx?.hash || txHash
    const fromAddress = parsedTx?.from || senderFromEvent || ''
    const toAddress = parsedTx?.to || toFromEvent || null
    // Use event amount if available and raw tx value is 0 or missing
    const rawValue = parsedTx?.value ? parsedTx.value.toString() : '0'
    const value = (rawValue === '0' && amountFromEvent) ? amountFromEvent : rawValue
    const gasLimit = parsedTx?.gasLimit ? Number(parsedTx.gasLimit.toString()) : 0
    const gasPrice = parsedTx?.gasPrice ? parsedTx.gasPrice.toString() : ''
    const nonce = typeof parsedTx?.nonce === 'number' ? parsedTx.nonce : 0
    const inputData = parsedTx?.data || ''
    // Prefer event txType if available, then parsed tx type
    const type = txTypeFromEvent ?? (typeof parsedTx?.type === 'number' ? parsedTx.type : 0)
    const maxFeePerGas = parsedTx?.maxFeePerGas?.toString()
    const maxPriorityFeePerGas = parsedTx?.maxPriorityFeePerGas?.toString()
    const accessList = parsedTx?.accessList?.map((entry) => ({
      address: entry.address,
      storage_keys: entry.storageKeys,
    }))

    // Decode function input data
    const decodedInput = decodeInputData(inputData)

    return {
      hash,
      tx_hash: txHash,
      from_address: fromAddress,
      to_address: toAddress,
      value,
      gas_limit: gasLimit,
      gas_price: gasPrice,
      gas_used: gasUsed ?? 0,
      nonce,
      input_data: inputData,
      contract_address: null,
      status: isSuccess ? 1 : 0,
      type,
      max_fee_per_gas: maxFeePerGas,
      max_priority_fee_per_gas: maxPriorityFeePerGas,
      access_list: accessList,
      decoded_input: decodedInput,
    }
  }

  // ============================================================================
  // ADDRESSES
  // ============================================================================

  async getTransactionsByAddress(
    address: string,
    limit = 50,
    offset = 0
  ): Promise<PaginatedResponse<EnhancedTransaction>> {
    // Get all messages involving this address
    const { data: addressMessages } = await this.query<Message>('messages_main', {
      filters: { or: `(sender.eq.${address},mentions.cs.%7B${address}%7D)` },
      order: 'id.desc'
    })

    // Extract unique tx IDs and paginate
    const allTxIds = [...new Set(addressMessages.map(msg => msg.id))]
    const paginatedTxIds = allTxIds.slice(offset, offset + limit)

    if (paginatedTxIds.length === 0) {
      return {
        data: [],
        pagination: {
          total: allTxIds.length,
          limit,
          offset,
          has_next: false,
          has_prev: offset > 0
        }
      }
    }

    // Batch fetch all data in parallel (4 queries instead of N*4)
    const idFilters = paginatedTxIds.map(id => `id.eq.${id}`).join(',')

    const [txResult, msgResult, eventResult] = await Promise.all([
      this.query<Transaction>('transactions_main', {
        filters: { or: `(${idFilters})` },
        order: 'height.desc'
      }),
      this.query<Message>('messages_main', {
        filters: { or: `(${idFilters})` },
        order: 'message_index.asc'
      }),
      this.query<Event>('events_main', {
        filters: { or: `(${idFilters})` },
        order: 'event_index.asc,attr_index.asc'
      })
    ])

    // Group messages and events by tx ID
    const messagesByTx = new Map<string, Message[]>()
    const eventsByTx = new Map<string, Event[]>()

    msgResult.data.forEach(msg => {
      const existing = messagesByTx.get(msg.id) || []
      existing.push(msg)
      messagesByTx.set(msg.id, existing)
    })

    eventResult.data.forEach(event => {
      const existing = eventsByTx.get(event.id) || []
      existing.push(event)
      eventsByTx.set(event.id, existing)
    })

    // Assemble enhanced transactions
    const enhanced: EnhancedTransaction[] = txResult.data.map(tx => ({
      ...tx,
      messages: messagesByTx.get(tx.id) || [],
      events: eventsByTx.get(tx.id) || [],
      ingest_error: null
    }))

    return {
      data: enhanced,
      pagination: {
        total: allTxIds.length,
        limit,
        offset,
        has_next: offset + limit < allTxIds.length,
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

  /**
   * Get messages for an address using the optimized RPC function
   * This uses the database function get_messages_for_address which is more efficient
   * than the manual OR filter approach
   * @example
   * const messages = await client.getMessagesForAddressRPC('manifest1...')
   */
  async getMessagesForAddressRPC(address: string): Promise<Message[]> {
    return this.rpc<Message[]>('get_messages_for_address', { _address: address })
  }

  // ============================================================================
  // EVM
  // ============================================================================

  /**
   * Get EVM transaction by Ethereum hash (0x...)
   * Useful for search - allows finding Cosmos tx from EVM hash
   * @example
   * const evmTx = await client.getEvmTxByHash('0x123...')
   * if (evmTx) navigate(`/transactions/${evmTx.tx_id}`)
   */
  async getEvmTxByHash(ethereumHash: string): Promise<EvmTxMap | null> {
    const { data } = await this.query<EvmTxMap>('evm_tx_map', {
      filters: { ethereum_tx_hash: `eq.${ethereumHash}` }
    })
    return data[0] || null
  }

  /**
   * Get EVM address activity stats
   * Returns tx_count, first_seen, last_seen for an EVM address
   * @example
   * const activity = await client.getEvmAddressActivity('0x35d367...6Aab154b')
   * // { address: '0x...', tx_count: 42, first_seen: '2024-01-01', last_seen: '2024-12-01' }
   */
  async getEvmAddressActivity(address: string): Promise<EvmAddressActivity | null> {
    const { data } = await this.query<EvmAddressActivity>('evm_address_activity', {
      filters: { address: `eq.${address}` }
    })
    return data[0] || null
  }

  /**
   * List EVM transactions with optional filters
   * @example
   * // Get all EVM txs
   * const txs = await client.getEvmTransactions({ limit: 20 })
   *
   * // Filter by recipient
   * const toAddress = await client.getEvmTransactions({ recipient: '0x...' })
   */
  async getEvmTransactions(options: {
    limit?: number
    offset?: number
    recipient?: string
    minHeight?: number
    maxHeight?: number
  } = {}): Promise<PaginatedResponse<EvmTxMap>> {
    const filters: Record<string, string> = {}

    if (options.recipient) {
      filters.recipient = `eq.${options.recipient}`
    }
    if (options.minHeight) {
      filters.height = `gte.${options.minHeight}`
    }
    if (options.maxHeight) {
      filters.height = `lte.${options.maxHeight}`
    }

    const { data, total } = await this.query<EvmTxMap>('evm_tx_map', {
      order: 'height.desc',
      limit: options.limit || 20,
      offset: options.offset || 0,
      count: true,
      filters
    })

    return {
      data,
      pagination: {
        total: total || data.length,
        limit: options.limit || 20,
        offset: options.offset || 0,
        has_next: (options.offset || 0) + (options.limit || 20) < (total || data.length),
        has_prev: (options.offset || 0) > 0
      }
    }
  }

  /**
   * Get top EVM addresses by transaction count
   * @example
   * const topAddresses = await client.getTopEvmAddresses(10)
   */
  async getTopEvmAddresses(limit = 10): Promise<EvmAddressActivity[]> {
    const { data } = await this.query<EvmAddressActivity>('evm_address_activity', {
      order: 'tx_count.desc',
      limit
    })
    return data
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

    // EVM transaction hash (0x + 64 hex chars)
    // Check this BEFORE regular tx hash since it's more specific
    if (/^0x[a-fA-F0-9]{64}$/.test(trimmedQuery)) {
      try {
        const evmTx = await this.getEvmTxByHash(trimmedQuery)
        if (evmTx) {
          // Return the Cosmos tx_id so frontend can navigate to /transactions/{tx_id}
          results.push({
            type: 'evm_transaction',
            value: evmTx,
            score: 100
          })
        }
      } catch {}
    }

    // Transaction hash (64 chars hex, no 0x prefix)
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
        // For EVM addresses, also check evm_address_activity
        if (isEthAddress) {
          const evmActivity = await this.getEvmAddressActivity(trimmedQuery)
          if (evmActivity && evmActivity.tx_count > 0) {
            results.push({
              type: 'evm_address',
              value: evmActivity,
              score: 95
            })
          }
        }

        const stats = await this.getAddressStats(trimmedQuery)
        if (stats.transaction_count > 0) {
          results.push({ type: 'address', value: stats, score: 90 })
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

  async getAverageGasPrice(limit = 1000): Promise<{ avgGasPrice: number; unit: string }> {
    const { data: transactions } = await this.query<any>('transactions_main', {
      select: 'fee',
      order: 'height.desc',
      limit
    })

    let totalGasPrice = 0
    let count = 0

    transactions.forEach((tx: any) => {
      if (tx.fee?.amount && Array.isArray(tx.fee.amount) && tx.fee.gasLimit) {
        const gasLimit = parseInt(tx.fee.gasLimit) || 0
        if (gasLimit > 0) {
          const totalFee = tx.fee.amount.reduce((sum: number, coin: { amount: string }) => {
            return sum + (parseFloat(coin.amount) || 0)
          }, 0)
          totalGasPrice += totalFee / gasLimit
          count++
        }
      }
    })

    return {
      avgGasPrice: count > 0 ? totalGasPrice / count : 0,
      unit: 'per gas unit'
    }
  }

  async getTransactionCostDistribution(limit = 1000): Promise<Array<{ range: string; count: number }>> {
    const { data: transactions } = await this.query<any>('transactions_main', {
      select: 'fee',
      order: 'height.desc',
      limit
    })

    const ranges = [
      { min: 0, max: 1000, label: '0-1k' },
      { min: 1000, max: 10000, label: '1k-10k' },
      { min: 10000, max: 100000, label: '10k-100k' },
      { min: 100000, max: 1000000, label: '100k-1M' },
      { min: 1000000, max: Infinity, label: '1M+' }
    ]

    const distribution = ranges.map(range => ({ range: range.label, count: 0 }))

    transactions.forEach((tx: any) => {
      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        const totalFee = tx.fee.amount.reduce((sum: number, coin: { amount: string }) => {
          return sum + (parseFloat(coin.amount) || 0)
        }, 0)

        const rangeIndex = ranges.findIndex(r => totalFee >= r.min && totalFee < r.max)
        if (rangeIndex !== -1) {
          distribution[rangeIndex].count++
        }
      }
    })

    return distribution
  }

  async getUniqueDenoms(): Promise<string[]> {
    const { data: transactions } = await this.query<any>('transactions_main', {
      select: 'fee',
      order: 'height.desc',
      limit: 5000
    })

    const denoms = new Set<string>()
    transactions.forEach((tx: any) => {
      if (tx.fee?.amount && Array.isArray(tx.fee.amount)) {
        tx.fee.amount.forEach((coin: { denom: string }) => {
          if (coin.denom) denoms.add(coin.denom)
        })
      }
    })

    return Array.from(denoms).sort()
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
