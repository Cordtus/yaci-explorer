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

export interface EvmLog {
	logIndex: number
	address: string
	topics: string[]
	data: string
}

export interface TransactionDetail extends Transaction {
	evm_data: EvmData | null
	evm_logs: EvmLog[]
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


export interface EvmData {
	// Standard EVM field names
	hash: string
	from: string
	to: string | null
	nonce: number
	gasLimit: string
	gasPrice: string
	maxFeePerGas: string | null
	maxPriorityFeePerGas: string | null
	value: string
	data: string | null
	type: number
	chainId: string | null
	gasUsed: number | null
	status: number
	functionName: string | null
	functionSignature: string | null
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
	value: { id?: string | number; height?: number; hash?: string; address?: string; tx_id?: string }
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

export interface GovernanceProposal {
	proposal_id: number
	title: string | null
	summary: string | null
	status: string
	submit_time: string
	deposit_end_time: string | null
	voting_start_time: string | null
	voting_end_time: string | null
	proposer: string | null
	tally: {
		yes: string | null
		no: string | null
		abstain: string | null
		no_with_veto: string | null
	}
	last_updated: string
}

export interface ProposalSnapshot {
	proposal_id: number
	status: string
	yes_count: string
	no_count: string
	abstain_count: string
	no_with_veto_count: string
	snapshot_time: string
}

// Legacy type aliases for compatibility
export type EnhancedTransaction = Transaction

// Client

export interface YaciClientConfig {
	baseUrl: string
}

export class YaciClient {
	private baseUrl: string
	private maxRetries = 3
	private retryDelay = 500

	constructor(config: YaciClientConfig) {
		this.baseUrl = config.baseUrl.replace(/\/$/, '')
	}

	getBaseUrl(): string {
		return this.baseUrl
	}

	private async fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
		let lastError: Error | null = null
		for (let attempt = 0; attempt < this.maxRetries; attempt++) {
			const res = await fetch(url, init)
			// HTTP 300 can occur during PostgREST schema cache reload with function overloads
			// Retry on 300, 502, 503, 504 (transient errors)
			if (res.ok) return res
			if (![300, 502, 503, 504].includes(res.status)) {
				throw new Error(`Request failed: ${res.status} ${res.statusText}`)
			}
			lastError = new Error(`Request failed: ${res.status} ${res.statusText}`)
			if (attempt < this.maxRetries - 1) {
				await new Promise(r => setTimeout(r, this.retryDelay * (attempt + 1)))
			}
		}
		throw lastError || new Error('Request failed after retries')
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

		const res = await this.fetchWithRetry(url.toString(), {
			headers: { 'Accept': 'application/json' }
		})

		return res.json()
	}

	async query<T>(table: string, params?: Record<string, string | number | Record<string, string>>): Promise<T> {
		const url = new URL(`${this.baseUrl}/${table}`)
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (typeof value === 'string' || typeof value === 'number') {
					url.searchParams.set(key, String(value))
				} else if (value && typeof value === 'object') {
					Object.entries(value).forEach(([k, v]) => {
						url.searchParams.set(k, v)
					})
				}
			})
		}

		const res = await this.fetchWithRetry(url.toString(), {
			headers: { 'Accept': 'application/json' }
		})

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
			block_height?: number
			block_height_min?: number
			block_height_max?: number
			message_type?: string
			timestamp_min?: string
			timestamp_max?: string
		}
	): Promise<PaginatedResponse<Transaction>> {
		return this.rpc('get_transactions_paginated', {
			_limit: limit,
			_offset: offset,
			_status: filters?.status,
			_block_height: filters?.block_height,
			_block_height_min: filters?.block_height_min,
			_block_height_max: filters?.block_height_max,
			_message_type: filters?.message_type,
			_timestamp_min: filters?.timestamp_min,
			_timestamp_max: filters?.timestamp_max
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

	async getBlocksPaginated(
		limit = 20,
		offset = 0,
		filters?: {
			minTxCount?: number
			fromDate?: string
			toDate?: string
		}
	): Promise<PaginatedResponse<BlockRaw & { tx_count: number }>> {
		return this.rpc('get_blocks_paginated', {
			_limit: limit,
			_offset: offset,
			_min_tx_count: filters?.minTxCount,
			_from_date: filters?.fromDate,
			_to_date: filters?.toDate
		})
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

	async getGasUsageDistribution(): Promise<Array<{ range: string; count: number }>> {
		return this.query('gas_usage_distribution')
	}

	async getGasEfficiency(): Promise<{
		avgGasLimit: number
		totalGasLimit: number
		transactionCount: number
		data: Array<{ range: string; count: number }>
	}> {
		const data = await this.query<Array<{ range: string; count: number }>>('gas_usage_distribution')
		const transactionCount = data.reduce((sum, d) => sum + d.count, 0)
		// Estimate average based on distribution midpoints
		const midpoints: Record<string, number> = {
			'0-100k': 50000,
			'100k-250k': 175000,
			'250k-500k': 375000,
			'500k-1M': 750000,
			'1M+': 1500000
		}
		let totalGasLimit = 0
		for (const d of data) {
			totalGasLimit += (midpoints[d.range] || 500000) * d.count
		}
		return {
			avgGasLimit: transactionCount > 0 ? Math.round(totalGasLimit / transactionCount) : 0,
			totalGasLimit,
			transactionCount,
			data
		}
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

	async getFeeRevenueOverTime(): Promise<Array<{ denom: string; total_amount: string }>> {
		return this.query('fee_revenue')
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

	// Governance endpoints

	async getGovernanceProposals(
		limit = 20,
		offset = 0,
		status?: string
	): Promise<PaginatedResponse<GovernanceProposal>> {
		return this.rpc('get_governance_proposals', {
			_limit: limit,
			_offset: offset,
			_status: status
		})
	}

	async getProposalDetail(proposalId: number): Promise<GovernanceProposal | undefined> {
		// Query returns flat columns, need to transform to nested tally object
		const result = await this.query<Array<{
			proposal_id: number
			title: string | null
			summary: string | null
			status: string
			submit_time: string
			deposit_end_time: string | null
			voting_start_time: string | null
			voting_end_time: string | null
			proposer: string | null
			yes_count: string | null
			no_count: string | null
			abstain_count: string | null
			no_with_veto_count: string | null
			last_updated: string
		}>>('governance_proposals', {
			proposal_id: `eq.${proposalId}`,
			limit: '1'
		})
		if (!result[0]) return undefined
		const row = result[0]
		return {
			proposal_id: row.proposal_id,
			title: row.title,
			summary: row.summary,
			status: row.status,
			submit_time: row.submit_time,
			deposit_end_time: row.deposit_end_time,
			voting_start_time: row.voting_start_time,
			voting_end_time: row.voting_end_time,
			proposer: row.proposer,
			tally: {
				yes: row.yes_count,
				no: row.no_count,
				abstain: row.abstain_count,
				no_with_veto: row.no_with_veto_count
			},
			last_updated: row.last_updated
		}
	}

	async getProposalSnapshots(proposalId: number): Promise<ProposalSnapshot[]> {
		return this.query('governance_snapshots', {
			proposal_id: `eq.${proposalId}`,
			order: 'snapshot_time.desc'
		})
	}

	async getProposalTally(proposalId: number): Promise<{ yes: number; no: number; abstain: number; no_with_veto: number }> {
		return this.rpc('compute_proposal_tally', { _proposal_id: proposalId })
	}
}

// Singleton instance
const baseUrl = import.meta.env.VITE_POSTGREST_URL || 'http://localhost:3000'
export const api = new YaciClient({ baseUrl })
