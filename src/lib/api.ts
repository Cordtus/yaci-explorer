/**
 * Republic Explorer API Client
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
}

export interface ChainStats {
	latest_block: number
	total_transactions: number
	unique_addresses: number
	evm_transactions: number
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
				// API may return either snake_case or camelCase depending on source
				chain_id?: string
				chainId?: string
				proposer_address?: string
				proposerAddress?: string
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

// Republic module types

export interface ComputeJob {
	job_id: number
	creator: string
	target_validator: string
	execution_image: string | null
	result_upload_endpoint: string | null
	result_fetch_endpoint: string | null
	verification_image: string | null
	fee_denom: string | null
	fee_amount: string | null
	status: 'PENDING' | 'COMPLETED' | 'FAILED'
	result_hash: string | null
	submit_tx_hash: string
	submit_height: number | null
	submit_time: string | null
	result_tx_hash: string | null
	result_height: number | null
	result_time: string | null
	created_at: string
	updated_at: string
}

export interface ComputeBenchmark {
	benchmark_id: number
	creator: string
	benchmark_type: string | null
	upload_endpoint: string | null
	retrieve_endpoint: string | null
	result_file_hash: string | null
	status: 'PENDING' | 'COMPLETED' | 'FAILED'
	submit_tx_hash: string
	submit_height: number | null
	submit_time: string | null
	result_tx_hash: string | null
	result_validator: string | null
	result_height: number | null
	result_time: string | null
	created_at: string
	updated_at: string
}

export interface ComputeStats {
	total_jobs: number
	pending_jobs: number
	completed_jobs: number
	failed_jobs: number
	total_benchmarks: number
	completed_benchmarks: number
}

export interface ValidatorIPFS {
	validator_address: string
	ipfs_multiaddrs: string[] | null
	ipfs_peer_id: string | null
	tx_hash: string
	height: number | null
	timestamp: string | null
	updated_at: string
}

// Validator types

export interface Validator {
	operator_address: string
	consensus_address: string | null
	moniker: string | null
	identity: string | null
	website: string | null
	details: string | null
	commission_rate: number | null
	commission_max_rate: number | null
	commission_max_change_rate: number | null
	min_self_delegation: number | null
	tokens: number | null
	delegator_shares: number | null
	status: string | null
	jailed: boolean
	creation_height: number | null
	first_seen_tx: string | null
	updated_at: string
	voting_power_pct: number
	delegator_count: number
	ipfs_peer_id?: string | null
}

export interface ValidatorDetail extends Validator {
	ipfs_multiaddrs?: string[] | null
}

export interface DelegationEvent {
	id: number
	event_type: 'DELEGATE' | 'UNDELEGATE' | 'REDELEGATE' | 'CREATE_VALIDATOR' | 'EDIT_VALIDATOR'
	delegator_address: string | null
	validator_address: string
	validator_moniker?: string | null
	src_validator_address: string | null
	amount: string | null
	denom: string | null
	tx_hash: string
	height: number | null
	timestamp: string | null
	created_at: string
}

export interface ValidatorStats {
	total_validators: number
	active_validators: number
	jailed_validators: number
	total_bonded_tokens: number
}

// Jailing event types

export interface ValidatorJailingEvent {
	height: number
	event_type: string
	reason: string
	power: string
	detected_at: string
}

export interface JailingEvent {
	height: number
	event_type: string
	validator_address: string
	operator_address: string | null
	moniker: string | null
	reason: string
	power: string
	created_at: string
}

// Analytics types

export interface NetworkOverview {
	total_validators: number
	active_validators: number
	jailed_validators: number
	total_bonded_tokens: string
	total_rewards_24h: string
	total_commission_24h: string
	avg_block_time: number
	total_transactions: number
	unique_addresses: number
}

export interface ValidatorRewardsHistory {
	height: number
	rewards: string
	commission: string
	block_time: string | null
}

export interface ValidatorTotalRewards {
	total_rewards: string
	total_commission: string
	blocks_with_rewards: number
}

export interface HourlyRewards {
	hour: string
	rewards: string
	commission: string
}

export interface ValidatorPerformance {
	uptime_percentage: number
	blocks_signed: number
	blocks_missed: number
	total_jailing_events: number
	last_jailed_height: number | null
	rewards_rank: number | null
	delegation_rank: number | null
}

export interface ValidatorSigningStats {
	total_blocks: number
	blocks_signed: number
	blocks_missed: number
	signing_percentage: number
	recent_missed_count: number
	first_signed_height: number | null
	last_signed_height: number | null
}

export interface ValidatorSigningInfo {
	address: string
	start_height: string
	index_offset: string
	jailed_until: string | null
	tombstoned: boolean
	missed_blocks_counter: string
}

export interface SlashingParams {
	signed_blocks_window: string
	min_signed_per_window: string
	downtime_jail_duration: string
	slash_fraction_double_sign: string
	slash_fraction_downtime: string
}

export interface ValidatorWithSigningStats {
	operator_address: string
	moniker: string
	status: string
	jailed: boolean
	tokens: string
	voting_power_pct: number
	commission_rate: number
	signing_percentage: number
	blocks_missed: number
}

export interface ValidatorLeaderboardEntry {
	operator_address: string
	moniker: string
	tokens: string
	commission_rate: string
	jailed: boolean
	delegator_count: number
	lifetime_rewards: string
	lifetime_commission: string
	jail_count: number
	last_jailed_height: number | null
}

export interface BlockSignature {
	height: number
	validator_index: number
	consensus_address: string
	signed: boolean
	block_id_flag: number
	block_time: string | null
}

export interface ValidatorEventSummary {
	height: number
	event_type: string
	validator_moniker: string | null
	operator_address: string | null
	details: Record<string, string>
	block_time: string | null
}

export interface DailyRewards {
	date: string
	total_rewards: string
	total_commission: string
	validators_earning: number
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
		offset = 0,
		altAddress?: string
	): Promise<PaginatedResponse<Transaction>> {
		return this.rpc('get_transactions_by_address', {
			_address: address,
			_limit: limit,
			_offset: offset,
			_alt_address: altAddress || null
		})
	}

	async getAddressStats(address: string, altAddress?: string): Promise<AddressStats> {
		return this.rpc('get_address_stats', {
			_address: address,
			_alt_address: altAddress || null
		})
	}

	// Transaction endpoints

	async getTransaction(hash: string): Promise<TransactionDetail> {
		return this.rpc('get_transaction_detail', { _hash: hash.toLowerCase() })
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

	async getGasUsageDistribution(): Promise<Array<{ gas_range: string; count: number }>> {
		return this.query('gas_usage_distribution')
	}

	async getGasEfficiency(): Promise<{
		avgGasLimit: number
		totalGasLimit: number
		transactionCount: number
		data: Array<{ gas_range: string; count: number }>
	}> {
		const data = await this.query<Array<{ gas_range: string; count: number }>>('gas_usage_distribution')
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
			totalGasLimit += (midpoints[d.gas_range] || 500000) * d.count
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

	// Denomination endpoints

	async getDenomMetadata(denom?: string): Promise<Array<{
		denom: string
		symbol: string
		name: string | null
		decimals: number
		description: string | null
		logo_uri: string | null
		coingecko_id: string | null
		is_native: boolean
		ibc_source_chain: string | null
		ibc_source_denom: string | null
		evm_contract: string | null
		updated_at: string
	}>> {
		const params: Record<string, string> = {}
		if (denom) params.denom = `eq.${denom}`
		return this.query('denom_metadata', params)
	}

	// EVM endpoints

	async requestEvmDecode(txHash: string): Promise<{ success: boolean }> {
		return this.rpc('request_evm_decode', { _tx_hash: txHash })
	}

	async getEvmContracts(limit = 50, offset = 0): Promise<Array<{
		address: string
		creator: string | null
		creation_tx: string | null
		bytecode_hash: string | null
		name: string | null
		is_verified: boolean
		creation_height: number
	}>> {
		return this.query('evm_contracts', {
			order: 'creation_height.desc',
			limit: String(limit),
			offset: String(offset)
		})
	}

	async isEvmContract(address: string): Promise<boolean> {
		const result = await this.query<Array<{ address: string }>>('evm_contracts', {
			address: `eq.${address.toLowerCase()}`,
			limit: '1',
			select: 'address'
		})
		return result.length > 0
	}

	async getEvmContractDetails(address: string): Promise<{
		address: string
		creator: string | null
		creation_tx: string | null
		creation_height: number | null
		bytecode_hash: string | null
		is_verified: boolean
		name: string | null
		abi: unknown | null
	} | null> {
		const result = await this.query<Array<{
			address: string
			creator: string | null
			creation_tx: string | null
			creation_height: number | null
			bytecode_hash: string | null
			is_verified: boolean
			name: string | null
			abi: unknown | null
		}>>('evm_contracts', {
			address: `eq.${address.toLowerCase()}`,
			limit: '1'
		})
		return result[0] || null
	}

	async getEvmContractCalls(address: string, limit = 50, offset = 0): Promise<{
		data: Array<{
			tx_id: string
			hash: string
			from: string
			value: string
			gas_used: number | null
			status: number
			function_name: string | null
			function_signature: string | null
			data: string | null
		}>
		total: number
	}> {
		const data = await this.query<Array<{
			tx_id: string
			hash: string
			from: string
			value: string
			gas_used: number | null
			status: number
			function_name: string | null
			function_signature: string | null
			data: string | null
		}>>('evm_transactions', {
			to: `eq.${address}`,
			order: 'tx_id.desc',
			limit: String(limit),
			offset: String(offset),
			select: 'tx_id,hash,from,value,gas_used,status,function_name,function_signature,data'
		})

		// For total count, fetch all tx_ids (lighter query)
		const allTxs = await this.query<Array<{ tx_id: string }>>('evm_transactions', {
			to: `eq.${address}`,
			select: 'tx_id'
		})

		return {
			data,
			total: allTxs.length
		}
	}

	async getEvmContractFunctionStats(address: string): Promise<Array<{
		function_name: string | null
		function_signature: string | null
		call_count: number
	}>> {
		// Get function call frequency for a contract
		const txs = await this.query<Array<{
			function_name: string | null
			function_signature: string | null
		}>>('evm_transactions', {
			to: `eq.${address}`,
			select: 'function_name,function_signature'
		})

		// Aggregate by function
		const stats = new Map<string, { name: string | null; signature: string | null; count: number }>()
		for (const tx of txs) {
			const key = tx.function_signature || 'unknown'
			const existing = stats.get(key)
			if (existing) {
				existing.count++
			} else {
				stats.set(key, { name: tx.function_name, signature: tx.function_signature, count: 1 })
			}
		}

		return Array.from(stats.values())
			.map(s => ({ function_name: s.name, function_signature: s.signature, call_count: s.count }))
			.sort((a, b) => b.call_count - a.call_count)
	}

	async getEvmTokens(limit = 50, offset = 0): Promise<Array<{
		address: string
		name: string | null
		symbol: string | null
		decimals: number | null
		total_supply: string | null
		type: string | null
		first_seen_height: number | null
	}>> {
		return this.query('evm_tokens', {
			order: 'first_seen_height.desc.nullslast,address.asc',
			limit: String(limit),
			offset: String(offset)
		})
	}

	async getEvmTokenTransfers(
		limit = 50,
		offset = 0,
		filters?: { tokenAddress?: string; fromAddress?: string; toAddress?: string }
	): Promise<Array<{
		tx_id: string
		log_index: number
		token_address: string
		from_address: string
		to_address: string
		value: string
	}>> {
		const params: Record<string, string> = {
			order: 'tx_id.desc',
			limit: String(limit),
			offset: String(offset)
		}
		if (filters?.tokenAddress) params.token_address = `eq.${filters.tokenAddress}`
		if (filters?.fromAddress) params.from_address = `eq.${filters.fromAddress}`
		if (filters?.toAddress) params.to_address = `eq.${filters.toAddress}`
		return this.query('evm_token_transfers', params)
	}

	// Validator endpoints

	async getValidators(limit = 100, offset = 0): Promise<Array<{
		operator_address: string
		consensus_pubkey: string | null
		moniker: string | null
		identity: string | null
		website: string | null
		details: string | null
		commission_rate: string | null
		tokens: string | null
		delegator_shares: string | null
		jailed: boolean
		status: string | null
		updated_at: string
	}>> {
		return this.query('validators', {
			order: 'tokens.desc.nullslast',
			limit: String(limit),
			offset: String(offset)
		})
	}

	async getValidatorsPaginated(
		limit = 20,
		offset = 0,
		filters?: {
			sortBy?: string
			sortDir?: string
			status?: string
			search?: string
		}
	): Promise<PaginatedResponse<Validator>> {
		return this.rpc('get_validators_paginated', {
			_limit: limit,
			_offset: offset,
			_sort_by: filters?.sortBy,
			_sort_dir: filters?.sortDir,
			_status: filters?.status,
			_search: filters?.search
		})
	}

	async getValidatorDetail(operatorAddress: string): Promise<ValidatorDetail | null> {
		return this.rpc('get_validator_detail', { _operator_address: operatorAddress })
	}

	async getDelegationEvents(
		validatorAddress: string,
		limit = 20,
		offset = 0,
		eventType?: string
	): Promise<PaginatedResponse<DelegationEvent>> {
		return this.rpc('get_delegation_events', {
			_validator_address: validatorAddress,
			_limit: limit,
			_offset: offset,
			_event_type: eventType
		})
	}

	async getValidatorStats(): Promise<ValidatorStats> {
		const result = await this.query<ValidatorStats[]>('validator_stats')
		return result[0]
	}

	async getValidatorJailingEvents(
		operatorAddress: string,
		limit = 50,
		offset = 0
	): Promise<ValidatorJailingEvent[]> {
		return this.rpc('get_validator_jailing_events', {
			_operator_address: operatorAddress,
			_limit: limit,
			_offset: offset
		})
	}

	async getRecentValidatorEvents(
		eventTypes: string[] = ['slash', 'liveness', 'jail'],
		limit = 50,
		offset = 0
	): Promise<JailingEvent[]> {
		return this.rpc('get_recent_validator_events', {
			_event_types: `{${eventTypes.join(',')}}`,
			_limit: limit,
			_offset: offset
		})
	}

	// IBC endpoints

	async getIbcChannels(limit = 50, offset = 0): Promise<Array<{
		channel_id: string
		port_id: string
		counterparty_channel_id: string | null
		counterparty_port_id: string | null
		connection_id: string | null
		state: string | null
		ordering: string | null
		version: string | null
		updated_at: string
	}>> {
		return this.query('ibc_channels', {
			order: 'channel_id.asc',
			limit: String(limit),
			offset: String(offset)
		})
	}

	// Republic module endpoints

	async getComputeJobs(
		limit = 20,
		offset = 0,
		filters?: { status?: string; creator?: string; validator?: string }
	): Promise<PaginatedResponse<ComputeJob>> {
		return this.rpc('get_compute_jobs', {
			_limit: limit,
			_offset: offset,
			_status: filters?.status,
			_creator: filters?.creator,
			_validator: filters?.validator
		})
	}

	async getComputeJob(jobId: number): Promise<ComputeJob | null> {
		return this.rpc('get_compute_job', { _job_id: jobId })
	}

	async getComputeBenchmarks(
		limit = 20,
		offset = 0,
		filters?: { status?: string }
	): Promise<PaginatedResponse<ComputeBenchmark>> {
		return this.rpc('get_compute_benchmarks', {
			_limit: limit,
			_offset: offset,
			_status: filters?.status
		})
	}

	async getComputeStats(): Promise<ComputeStats> {
		const result = await this.query<ComputeStats[]>('compute_stats')
		return result[0]
	}

	async getValidatorIPFS(limit = 50, offset = 0): Promise<ValidatorIPFS[]> {
		return this.query('validator_ipfs_addresses', {
			order: 'updated_at.desc',
			limit: String(limit),
			offset: String(offset)
		})
	}

	// Delegator endpoints

	async getDelegatorHistory(
		delegatorAddress: string,
		limit = 50,
		offset = 0,
		eventType?: string
	): Promise<PaginatedResponse<DelegationEvent>> {
		return this.rpc('get_delegator_history', {
			_delegator_address: delegatorAddress,
			_limit: limit,
			_offset: offset,
			_event_type: eventType
		})
	}

	async getDelegatorDelegations(delegatorAddress: string): Promise<{
		delegations: Array<{
			validator_address: string
			validator_moniker: string | null
			commission_rate: string | null
			validator_status: string | null
			validator_jailed: boolean | null
			denom: string
			total_delegated: string
		}>
		total_staked: string
		validator_count: number
	}> {
		return this.rpc('get_delegator_delegations', {
			_delegator_address: delegatorAddress
		})
	}

	async getDelegatorStats(delegatorAddress: string): Promise<{
		total_delegations: number
		total_undelegations: number
		total_redelegations: number
		first_delegation: string | null
		last_activity: string | null
		unique_validators: number
	}> {
		return this.rpc('get_delegator_stats', {
			_delegator_address: delegatorAddress
		})
	}

	async getDelegatorValidatorHistory(
		delegatorAddress: string,
		validatorAddress: string,
		limit = 50,
		offset = 0
	): Promise<PaginatedResponse<DelegationEvent>> {
		return this.rpc('get_delegator_validator_history', {
			_delegator_address: delegatorAddress,
			_validator_address: validatorAddress,
			_limit: limit,
			_offset: offset
		})
	}

	// Analytics endpoints

	async getNetworkOverview(): Promise<NetworkOverview> {
		const result = await this.rpc<NetworkOverview[]>('get_network_overview')
		return result[0]
	}

	async getValidatorRewardsHistory(
		operatorAddress: string,
		limit = 100,
		offset = 0
	): Promise<ValidatorRewardsHistory[]> {
		return this.rpc('get_validator_rewards_history', {
			_operator_address: operatorAddress,
			_limit: limit,
			_offset: offset
		})
	}

	async getValidatorTotalRewards(operatorAddress: string): Promise<ValidatorTotalRewards> {
		const result = await this.rpc<ValidatorTotalRewards[]>('get_validator_total_rewards', {
			_operator_address: operatorAddress
		})
		return result[0]
	}

	async getHourlyRewards(hours = 24): Promise<HourlyRewards[]> {
		return this.rpc('get_hourly_rewards', {
			_hours: hours
		})
	}

	async getValidatorPerformance(operatorAddress: string): Promise<ValidatorPerformance> {
		const result = await this.rpc<ValidatorPerformance[]>('get_validator_performance', {
			_operator_address: operatorAddress
		})
		return result[0]
	}

	async getValidatorLeaderboard(): Promise<ValidatorLeaderboardEntry[]> {
		return this.query('mv_validator_leaderboard', {
			order: 'tokens.desc'
		})
	}

	async getValidatorEventsSummary(limit = 20): Promise<ValidatorEventSummary[]> {
		return this.rpc('get_validator_events_summary', {
			_limit: limit
		})
	}

	async getDailyRewards(days = 30): Promise<DailyRewards[]> {
		return this.query('mv_daily_rewards', {
			order: 'date.desc',
			limit: String(days)
		})
	}

	/**
	 * Get signing stats for a specific validator (from indexed block signatures)
	 */
	async getValidatorSigningStats(consensusAddress: string, windowSize = 10000): Promise<ValidatorSigningStats> {
		const result = await this.rpc<ValidatorSigningStats[]>('get_validator_signing_stats', {
			_consensus_address: consensusAddress,
			_window_size: windowSize
		})
		return result[0]
	}

	/**
	 * Get signing stats for all validators (from indexed block signatures)
	 */
	async getAllValidatorsSigningStats(windowSize = 10000): Promise<Array<{
		consensus_address: string
		total_blocks: number
		blocks_signed: number
		blocks_missed: number
		signing_percentage: number
	}>> {
		return this.rpc('get_all_validators_signing_stats', {
			_window_size: windowSize
		})
	}

	/**
	 * Get validators with signing stats for the list page
	 */
	async getValidatorsWithSigningStats(limit = 100, offset = 0): Promise<ValidatorWithSigningStats[]> {
		return this.rpc('get_validators_with_signing_stats', {
			_limit: limit,
			_offset: offset
		})
	}

	/**
	 * Get recent block signatures for a validator (for signing history chart)
	 */
	async getValidatorBlockSignatures(consensusAddress: string, limit = 200): Promise<BlockSignature[]> {
		return this.query('validator_block_signatures', {
			consensus_address: `eq.${consensusAddress.toUpperCase()}`,
			order: 'height.desc',
			limit: String(limit)
		})
	}

}

/**
 * Get live signing info from chain for a validator
 */
export async function getValidatorSigningInfoLive(consAddress: string): Promise<ValidatorSigningInfo | null> {
	const config = getConfig()
	const apiUrl = config.apiUrl

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 5000)

	try {
		const response = await fetch(`${apiUrl}/chain/slashing/signing_info/${consAddress}`, {
			signal: controller.signal
		})
		clearTimeout(timeoutId)

		if (!response.ok) {
			console.warn(`Failed to fetch signing info: ${response.status}`)
			return null
		}

		const data = await response.json()
		return data.val_signing_info || null
	} catch (err) {
		clearTimeout(timeoutId)
		console.warn('Failed to fetch signing info:', err)
		return null
	}
}

/**
 * Get slashing params from chain (includes signed_blocks_window)
 */
export async function getSlashingParams(): Promise<SlashingParams | null> {
	const config = getConfig()
	const apiUrl = config.apiUrl

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 5000)

	try {
		const response = await fetch(`${apiUrl}/chain/slashing/params`, {
			signal: controller.signal
		})
		clearTimeout(timeoutId)

		if (!response.ok) {
			console.warn(`Failed to fetch slashing params: ${response.status}`)
			return null
		}

		const data = await response.json()
		return data.params || null
	} catch (err) {
		clearTimeout(timeoutId)
		console.warn('Failed to fetch slashing params:', err)
		return null
	}
}

import { getConfig } from './env'

// Singleton instance
const baseUrl = getConfig().apiUrl
export const api = new YaciClient({ baseUrl })

// Chain query types
export interface TokenBalance {
	denom: string
	amount: string
}

export interface BalancesResponse {
	balances: TokenBalance[]
}

// Chain query client for direct chain queries (balances, supply, etc.)
// Uses the middleware's /chain/* endpoints which proxy to chain gRPC
export async function getAccountBalances(address: string): Promise<TokenBalance[]> {
	const config = getConfig()
	const apiUrl = config.apiUrl

	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

		const response = await fetch(`${apiUrl}/chain/balances/${address}`, {
			signal: controller.signal
		})
		clearTimeout(timeoutId)

		if (!response.ok) {
			console.warn(`Failed to fetch balances: ${response.status}`)
			return []
		}
		const data: BalancesResponse = await response.json()
		return data.balances || []
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.warn('Balance fetch timed out')
		} else {
			console.warn('Failed to fetch account balances:', error)
		}
		return []
	}
}

/**
 * Fetch native token balance via EVM JSON-RPC (fallback when chain-query-service unavailable)
 * @param evmAddress - The 0x-prefixed EVM address
 * @returns Token balance in base units (e.g., arai) or null on error
 */
export async function getEvmBalance(evmAddress: string): Promise<TokenBalance | null> {
	try {
		const { REPUBLIC_CHAIN_CONFIG } = await import('@/lib/chain-config')

		const response = await fetch(REPUBLIC_CHAIN_CONFIG.endpoints.evmRpc, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_getBalance',
				params: [evmAddress, 'latest'],
				id: 1,
			}),
		})

		if (!response.ok) return null

		const result = await response.json()
		if (result.error) return null

		// Convert hex balance to decimal string
		const balanceWei = BigInt(result.result)

		return {
			denom: REPUBLIC_CHAIN_CONFIG.nativeCurrency.denom, // 'arai'
			amount: balanceWei.toString(),
		}
	} catch (error) {
		console.warn('Failed to fetch EVM balance:', error)
		return null
	}
}
