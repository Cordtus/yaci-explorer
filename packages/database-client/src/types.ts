/**
 * Core blockchain types aligned with yaci indexer schema
 * These types reflect the PostgreSQL database schema created by the Yaci indexer
 */

/**
 * Block data structure from blocks_raw table
 * Contains complete block information including header, transactions, and metadata
 */
export interface Block {
  id: number
  data: {
    txs?: any[] // Decoded transaction objects at root level
    block: {
      header: {
        version: any
        chain_id: string
        height: string
        time: string
        last_block_id: any
        last_commit_hash: string
        data_hash: string
        validators_hash: string
        next_validators_hash: string
        consensus_hash: string
        app_hash: string
        last_results_hash: string
        evidence_hash: string
        proposer_address: string
      }
      data: {
        txs?: string[] // Raw base64-encoded transaction bytes
      }
      evidence: any
      last_commit: any
      lastCommit?: any
    }
    block_id?: {
      hash: string
      part_set_header: any
    }
    blockId?: {
      hash: string
      part_set_header: any
    }
    lastCommit?: any
  }
}

/**
 * Transaction data from transactions_main table
 * Represents a blockchain transaction with fees, status, and timing information
 */
export interface Transaction {
  id: string // tx hash
  fee: {
    amount: Array<{
      denom: string
      amount: string
    }>
    gasLimit: string // Note: yaci uses gasLimit not gas_limit
    payer?: string
    granter?: string
  }
  memo: string | null
  error: string | null
  height: number // bigint in DB
  timestamp: string // timestamp with time zone
  proposal_ids: string[] | null // Note: plural
}

/**
 * Message data from messages_main table
 * Represents a single message within a transaction (e.g., MsgSend, MsgDelegate)
 */
export interface Message {
  id: string // tx hash
  message_index: number
  type: string | null // message type URL
  sender: string | null
  mentions: string[] | null // array of addresses mentioned
  metadata: any | null // parsed message fields as jsonb
  data?: any // raw message payload (when available)
}

/**
 * Event data from events_main table
 * Represents a single event attribute emitted during transaction execution
 */
export interface Event {
  id: string // tx hash
  event_index: number
  attr_index: number
  event_type: string
  attr_key: string
  attr_value: string
  msg_index: number | null // null for block-level events
}

// EVM-specific types
export interface EVMTransaction {
  hash: string
  tx_hash: string
  from_address: string
  to_address: string | null
  value: string
  gas_limit: number
  gas_price: string
  gas_used: number
  nonce: number
  input_data: string
  contract_address: string | null
  status: 0 | 1
  type: number
  max_fee_per_gas?: string
  max_priority_fee_per_gas?: string
  access_list?: Array<{
    address: string
    storage_keys: string[]
  }>
}

export interface EVMLog {
  tx_hash: string
  log_index: number
  address: string
  topics: string[]
  data: string
  removed: boolean
}

export interface TokenTransfer {
  tx_hash: string
  log_index: number
  token_address: string
  from_address: string
  to_address: string
  value: string
  token_id?: string
  token_type: 'ERC20' | 'ERC721' | 'ERC1155'
  block_number: number
  timestamp: string
}

export interface Contract {
  address: string
  creator_address: string
  creation_tx_hash: string
  bytecode: string
  is_verified: boolean
  contract_name?: string
  compiler_version?: string
  optimization_enabled?: boolean
  runs?: number
  source_code?: string
  abi?: any[]
  constructor_args?: string
  verified_at?: string
}

export interface Address {
  address: string
  balance: {
    native: string
    tokens: Array<{
      token_address: string
      symbol: string
      name: string
      decimals: number
      balance: string
    }>
  }
  transaction_count: number
  first_seen: string
  last_seen: string
  is_contract: boolean
  contract_info?: Contract
}

/**
 * Enhanced transaction type that includes related messages, events, and EVM data
 * Used for transaction detail views with complete information
 */
export interface EnhancedTransaction extends Transaction {
  messages: Message[]
  events: Event[]
  evm_data?: EVMTransaction
  logs?: EVMLog[]
  token_transfers?: TokenTransfer[]
  decoded_input?: {
    method_id: string
    method_name: string
    params: Array<{
      name: string
      type: string
      value: any
    }>
  }
  ingest_error?: { message: string; reason: string | null; hash: string } | null
  raw_data?: any
}

/**
 * Generic paginated API response wrapper
 * Includes data array and pagination metadata for list endpoints
 * @template T - The type of data items in the response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_next: boolean
    has_prev: boolean
  }
}

/**
 * Chain-wide statistics and metrics
 * Used for dashboard overview and network health monitoring
 */
export interface ChainStats {
  latest_block: number
  total_transactions: number
  avg_block_time: number
  tps: number
  active_validators: number
  total_supply: string
  market_cap?: string
  price?: number
}

/**
 * Search result wrapper with type information and relevance score
 * Used by universal search to return heterogeneous results
 */
export interface SearchResult {
  type: 'block' | 'transaction' | 'address' | 'contract'
  value: any
  score: number
}
