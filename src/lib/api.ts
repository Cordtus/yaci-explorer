/**
 * YACI Explorer API Client
 * Self-contained client for PostgREST RPC endpoints
 */

// Types

export interface Pagination {
	total: number
	limit: number
	offset: number
	has_next: boolean
	has_prev: boolean
}

export interface PaginatedResponse<T> {
	data: T[]
	pagination: Pagination
}

export interface Transaction {
	id: string
	fee: TransactionFee
	memo: string | null
	error: string | null
	height: number
	timestamp: string
	proposal_ids: number[] | null
	messages: Message[]
	events: Event[]
	ingest_error: IngestError | null
}

export interface TransactionDetail extends Transaction {
	evm_data: EvmData | null
	raw_data: unknown
}

export interface TransactionFee {
	amount: Array<{ denom: string; amount: string }>
	gasLimit: string
}

export interface IngestError {
	message: string
	reason: string
	hash: string
}

export interface Message {
	id: string
	message_index: number
	type: string
	sender: string | null
	mentions: string[]
	metadata: Record<string, unknown>
	data?: {
		from_address?: string
		to_address?: string
		[key: string]: unknown
	}
}

export interface Event {
	id: string
	event_index: number
	attr_index: number
	event_type: string
	attr_key: string
	attr_value: string
	msg_index: number | null
}

export interface DecodedInput {
	methodName: string
	methodId: string
	params: Array<{
		name: string
		type: string
		value: unknown
	}>
}

export interface AccessListEntry {
	address: string
	storage_keys: string[]
}

export interface EvmData {
	ethereum_tx_hash: string | null
	recipient: string | null
	gas_used: number
	tx_type: number | null
	// Extended EVM fields
	hash: string
	type: number
	nonce: number
	from_address: string | null
	to_address: string | null
	value: string
	gas_limit: number
	gas_price: string
	status: number
	input_data: string | null
	decoded_input: DecodedInput | null
	max_fee_per_gas: string | null
	max_priority_fee_per_gas: string | null
	access_list?: AccessListEntry[]
}

export interface AddressStats {
	address: string
	transaction_count: number
	first_seen: string | null
	last_seen: string | null
	total_sent: number
	total_received: number
}

export interface ChainStats {
	latest_block: number
	total_transactions: number
	unique_addresses: number
	avg_block_time: number
	min_block_time: number
	max_block_time: number
	active_validators: number
}

export interface SearchResult {
	type: 'block' | 'transaction' | 'evm_transaction' | 'address' | 'evm_address'
	value: { id?: string | number; height?: number; hash?: string; address?: string }
	score: number
}

export interface BlockRaw {
	id: number
	data: {
		block_id?: {
			hash: string
		}
		blockId?: {
			hash: string
		}
		txs?: string[]
		block: {
			header: {
				height: string
				time: string
				chain_id: string
				proposer_address: string
			}
			data: {
				txs: string[]
			}
			last_commit?: {
				signatures: Array<{
					validator_address: string
					signature: string
				}>
			}
		}
	}
}

// Legacy type aliases for compatibility
export type EnhancedTransaction = Transaction
export type EVMTransaction = EvmData

// Client

export interface YaciClientConfig {
	baseUrl: string
}

export class YaciClient {
	private baseUrl: string

	constructor(config: YaciClientConfig) {
		this.baseUrl = config.baseUrl.replace(/\/$/, '')
	}

	getBaseUrl(): string {
		return this.baseUrl
	}

	private async rpc<T>(fn: string, params?: Record<string, unknown>): Promise<T> {
		const url = new URL(`${this.baseUrl}/rpc/${fn}`)
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.set(key, String(value))
				}
			})
		}

		const res = await fetch(url.toString(), {
			headers: { 'Accept': 'application/json' }
		})

		if (!res.ok) {
			throw new Error(`RPC ${fn} failed: ${res.status} ${res.statusText}`)
		}

		return res.json()
	}

	async query<T>(table: string, params?: Record<string, string | number | Record<string, string>>): Promise<T> {
		const url = new URL(`${this.baseUrl}/${table}`)
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (typeof value === 'string' || typeof value === 'number') {
					url.searchParams.set(key, String(value))
				} else if (value && typeof value === 'object') {
					// Handle nested objects like filters
					Object.entries(value).forEach(([k, v]) => {
						url.searchParams.set(k, v)
					})
				}
			})
		}

		const res = await fetch(url.toString(), {
			headers: { 'Accept': 'application/json' }
		})

		if (!res.ok) {
			throw new Error(`Query ${table} failed: ${res.status} ${res.statusText}`)
		}

		return res.json()
	}

	// Address endpoints

	async getTransactionsByAddress(
		address: string,
		limit = 50,
		offset = 0
	): Promise<PaginatedResponse<Transaction>> {
		return this.rpc('get_transactions_by_address', {
			_address: address,
			_limit: limit,
			_offset: offset
		})
	}

	async getAddressStats(address: string): Promise<AddressStats> {
		return this.rpc('get_address_stats', { _address: address })
	}

	// Transaction endpoints

	async getTransaction(hash: string): Promise<TransactionDetail> {
		return this.rpc('get_transaction_detail', { _hash: hash })
	}

	async getTransactions(
		limit = 20,
		offset = 0,
		filters?: {
			status?: 'success' | 'failed'
			blockHeight?: number
			messageType?: string
		}
	): Promise<PaginatedResponse<Transaction>> {
		return this.rpc('get_transactions_paginated', {
			_limit: limit,
			_offset: offset,
			_status: filters?.status,
			_block_height: filters?.blockHeight,
			_message_type: filters?.messageType
		})
	}

	// Block endpoints

	async getBlock(height: number): Promise<BlockRaw | undefined> {
		const result = await this.query<BlockRaw[]>('blocks_raw', {
			id: `eq.${height}`,
			limit: '1'
		})
		return result[0]
	}

	async getBlocks(limit = 20, offset = 0): Promise<PaginatedResponse<BlockRaw>> {
		const blocks = await this.query<BlockRaw[]>('blocks_raw', {
			order: 'id.desc',
			limit: String(limit),
			offset: String(offset)
		})
		// Get total count for pagination
		const latestBlock = await this.getLatestBlock()
		const total = latestBlock?.id || 0
		return {
			data: blocks,
			pagination: {
				total,
				limit,
				offset,
				has_next: offset + limit < total,
				has_prev: offset > 0
			}
		}
	}

	async getLatestBlock(): Promise<BlockRaw | undefined> {
		const result = await this.query<BlockRaw[]>('blocks_raw', {
			order: 'id.desc',
			limit: '1'
		})
		return result[0]
	}

	// Search endpoint

	async search(query: string): Promise<SearchResult[]> {
		return this.rpc('universal_search', { _query: query })
	}

	// Analytics endpoints

	async getChainStats(): Promise<ChainStats> {
		const result = await this.query<ChainStats[]>('chain_stats')
		return result[0]
	}

	async getTxVolumeDaily(): Promise<Array<{ date: string; count: number }>> {
		return this.query('tx_volume_daily', { order: 'date.desc' })
	}

	async getHourlyTransactionVolume(limit?: number): Promise<Array<{ hour: string; count: number }>> {
		const params: Record<string, string> = { order: 'hour.desc' }
		if (limit) params.limit = String(limit)
		return this.query('tx_volume_hourly', params)
	}

	async getMessageTypeStats(): Promise<Array<{ type: string; count: number }>> {
		return this.query('message_type_stats')
	}

	async getTransactionTypeDistribution(): Promise<Array<{ type: string; count: number }>> {
		return this.query('message_type_stats')
	}

	async getGasUsageDistribution(limit?: number): Promise<Array<{ range: string; count: number }>> {
		return this.rpc('get_gas_usage_distribution', limit ? { _limit: limit } : undefined)
	}

	async getGasEfficiency(limit?: number): Promise<{
		avgGasLimit: number
		totalGasLimit: number
		transactionCount: number
		data: Array<{ range: string; count: number }>
	}> {
		return this.rpc('get_gas_efficiency', limit ? { _limit: limit } : undefined)
	}

	async getTxSuccessRate(): Promise<{
		total: number
		successful: number
		failed: number
		success_rate_percent: number
	}> {
		const result = await this.query<Array<{
			total: number
			successful: number
			failed: number
			success_rate_percent: number
		}>>('tx_success_rate')
		return result[0]
	}

	async getFeeRevenueOverTime(days?: number): Promise<Array<{ date: string; revenue: Record<string, number> }>> {
		return this.rpc('get_fee_revenue_over_time', days ? { _days: days } : undefined)
	}

	async getTotalFeeRevenue(): Promise<Record<string, string | number>> {
		const result = await this.query<Array<{ denom: string; total_amount: string }>>('fee_revenue')
		const revenue: Record<string, string | number> = {}
		for (const item of result) {
			revenue[item.denom] = item.total_amount
		}
		return revenue
	}

	async getDistinctMessageTypes(): Promise<string[]> {
		const result = await this.query<Array<{ type: string }>>('message_type_stats', {
			select: 'type',
			order: 'count.desc'
		})
		return result.map(r => r.type)
	}

	async getBlockTimeAnalysis(limit = 100): Promise<{ avg: number; min: number; max: number }> {
		return this.rpc('get_block_time_analysis', { _limit: limit })
	}

	async getActiveAddressesDaily(days = 30): Promise<Array<{ date: string; count: number }>> {
		return this.rpc('get_active_addresses_daily', { _days: days })
	}
}

// Singleton instance
const baseUrl = import.meta.env.VITE_POSTGREST_URL || 'http://localhost:3000'
export const api = new YaciClient({ baseUrl })
