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
	signing_percentage: number | null
	blocks_signed: number | null
	blocks_missed: number | null
	last_signed_height: number | null
	missed_blocks_counter: number | null
	last_jailed_height: number | null
	last_jailed_at: string | null
}

export interface ValidatorDetail extends Validator {
	ipfs_multiaddrs?: string[] | null
	ipfs_peer_id?: string | null
}

export interface ValidatorStats {
	total_validators: number
	active_validators: number
	inactive_validators: number
	jailed_validators: number
	total_bonded_tokens: number
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
	block_time: string | null
	attributes: Record<string, string> | null
}

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
	max_validators: number
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

export interface DailyRewards {
	date: string
	total_rewards: string
	total_commission: string
	validators_earning: number
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

// EVM contract types

export interface EvmContract {
	address: string
	creator: string | null
	creation_tx: string | null
	bytecode_hash: string | null
	name: string | null
	is_verified: boolean
	creation_height: number
}

export interface EvmToken {
	address: string
	name: string | null
	symbol: string | null
	decimals: number | null
	total_supply: string | null
	type: string | null
	first_seen_height: number | null
}

export interface EvmTokenTransfer {
	tx_id: string
	log_index: number
	token_address: string
	from_address: string
	to_address: string
	value: string
}

// Chain query types

export interface TokenBalance {
	denom: string
	amount: string
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
			if (res.ok) return res
			if (![502, 503, 504].includes(res.status)) {
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

	async getEvmContracts(limit = 50, offset = 0): Promise<EvmContract[]> {
		return this.query('evm_contracts', {
			order: 'creation_height.desc',
			limit: String(limit),
			offset: String(offset),
		})
	}

	async isEvmContract(address: string): Promise<boolean> {
		const result = await this.query<Array<{ address: string }>>('evm_contracts', {
			address: `eq.${address.toLowerCase()}`,
			limit: '1',
			select: 'address',
		})
		return result.length > 0
	}

	async getEvmContractDetails(address: string): Promise<(EvmContract & { abi: unknown | null }) | null> {
		const result = await this.query<Array<EvmContract & { abi: unknown | null }>>('evm_contracts', {
			address: `eq.${address.toLowerCase()}`,
			limit: '1',
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
			select: 'tx_id,hash,from,value,gas_used,status,function_name,function_signature,data',
		})
		const allTxs = await this.query<Array<{ tx_id: string }>>('evm_transactions', {
			to: `eq.${address}`,
			select: 'tx_id',
		})
		return { data, total: allTxs.length }
	}

	async getEvmContractFunctionStats(address: string): Promise<Array<{
		function_name: string | null
		function_signature: string | null
		call_count: number
	}>> {
		const txs = await this.query<Array<{
			function_name: string | null
			function_signature: string | null
		}>>('evm_transactions', {
			to: `eq.${address}`,
			select: 'function_name,function_signature',
		})
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

	async getEvmTokens(limit = 50, offset = 0): Promise<EvmToken[]> {
		return this.query('evm_tokens', {
			order: 'first_seen_height.desc.nullslast,address.asc',
			limit: String(limit),
			offset: String(offset),
		})
	}

	async getEvmTokenTransfers(
		limit = 50,
		offset = 0,
		filters?: { tokenAddress?: string; fromAddress?: string; toAddress?: string },
	): Promise<EvmTokenTransfer[]> {
		const params: Record<string, string> = {
			order: 'tx_id.desc',
			limit: String(limit),
			offset: String(offset),
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
			offset: String(offset),
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
		},
	): Promise<PaginatedResponse<Validator>> {
		return this.rpc('get_validators_paginated', {
			_limit: limit,
			_offset: offset,
			_sort_by: filters?.sortBy,
			_sort_dir: filters?.sortDir,
			_status: filters?.status,
			_search: filters?.search,
		})
	}

	async getValidatorDetail(operatorAddress: string): Promise<ValidatorDetail | null> {
		return this.rpc('get_validator_detail', { _operator_address: operatorAddress })
	}

	async getDelegationEvents(
		validatorAddress: string,
		limit = 20,
		offset = 0,
		eventType?: string,
	): Promise<PaginatedResponse<DelegationEvent>> {
		return this.rpc('get_delegation_events', {
			_validator_address: validatorAddress,
			_limit: limit,
			_offset: offset,
			_event_type: eventType,
		})
	}

	async getValidatorStats(): Promise<ValidatorStats> {
		const result = await this.query<ValidatorStats[]>('validator_stats')
		return result[0]
	}

	async getValidatorJailingEvents(
		operatorAddress: string,
		limit = 50,
		offset = 0,
	): Promise<ValidatorJailingEvent[]> {
		return this.rpc('get_validator_jailing_events', {
			_operator_address: operatorAddress,
			_limit: limit,
			_offset: offset,
		})
	}

	async getRecentValidatorEvents(
		eventTypes: string[] = ['slash', 'liveness', 'jail'],
		limit = 50,
		offset = 0,
	): Promise<JailingEvent[]> {
		return this.rpc('get_recent_validator_events', {
			_event_types: `{${eventTypes.join(',')}}`,
			_limit: limit,
			_offset: offset,
		})
	}

	async requestValidatorRefresh(operatorAddress: string): Promise<{ status: string }> {
		return this.rpc('request_validator_refresh', { _operator_address: operatorAddress })
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
			offset: String(offset),
		})
	}

	// Delegator endpoints

	async getDelegatorHistory(
		delegatorAddress: string,
		limit = 50,
		offset = 0,
		eventType?: string,
	): Promise<PaginatedResponse<DelegationEvent>> {
		return this.rpc('get_delegator_history', {
			_delegator_address: delegatorAddress,
			_limit: limit,
			_offset: offset,
			_event_type: eventType,
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
			_delegator_address: delegatorAddress,
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
			_delegator_address: delegatorAddress,
		})
	}

	async getDelegatorValidatorHistory(
		delegatorAddress: string,
		validatorAddress: string,
		limit = 50,
		offset = 0,
	): Promise<PaginatedResponse<DelegationEvent>> {
		return this.rpc('get_delegator_validator_history', {
			_delegator_address: delegatorAddress,
			_validator_address: validatorAddress,
			_limit: limit,
			_offset: offset,
		})
	}

	// Network analytics endpoints

	async getNetworkOverview(): Promise<NetworkOverview> {
		const result = await this.rpc<NetworkOverview[]>('get_network_overview')
		return result[0]
	}

	async getValidatorRewardsHistory(
		operatorAddress: string,
		limit = 100,
		offset = 0,
	): Promise<ValidatorRewardsHistory[]> {
		return this.rpc('get_validator_rewards_history', {
			_operator_address: operatorAddress,
			_limit: limit,
			_offset: offset,
		})
	}

	async getValidatorTotalRewards(operatorAddress: string): Promise<ValidatorTotalRewards> {
		const result = await this.rpc<ValidatorTotalRewards[]>('get_validator_total_rewards', {
			_operator_address: operatorAddress,
		})
		return result[0]
	}

	async getHourlyRewards(hours = 24): Promise<HourlyRewards[]> {
		return this.rpc('get_hourly_rewards', { _hours: hours })
	}

	async getDailyRewards(days = 30): Promise<DailyRewards[]> {
		return this.query('rt_daily_rewards', {
			order: 'date.desc',
			limit: String(days),
		})
	}

	async getValidatorPerformance(operatorAddress: string): Promise<ValidatorPerformance> {
		const result = await this.rpc<ValidatorPerformance[]>('get_validator_performance', {
			_operator_address: operatorAddress,
		})
		return result[0]
	}

	async getValidatorLeaderboard(): Promise<ValidatorLeaderboardEntry[]> {
		return this.query('mv_validator_leaderboard', {
			order: 'tokens.desc',
		})
	}

	async getValidatorEventsSummary(limit = 20): Promise<ValidatorEventSummary[]> {
		return this.rpc('get_validator_events_summary', { _limit: limit })
	}

	async getValidatorSigningStats(consensusAddress: string, windowSize = 10000): Promise<ValidatorSigningStats> {
		const result = await this.rpc<ValidatorSigningStats[]>('get_validator_signing_stats', {
			_consensus_address: consensusAddress,
			_window_size: windowSize,
		})
		return result[0]
	}

	async getAllValidatorsSigningStats(windowSize = 10000): Promise<Array<{
		consensus_address: string
		total_blocks: number
		blocks_signed: number
		blocks_missed: number
		signing_percentage: number
	}>> {
		return this.rpc('get_all_validators_signing_stats', { _window_size: windowSize })
	}

	async getValidatorsWithSigningStats(limit = 100, offset = 0): Promise<ValidatorWithSigningStats[]> {
		return this.rpc('get_validators_with_signing_stats', {
			_limit: limit,
			_offset: offset,
		})
	}

	async getValidatorBlockSignatures(consensusAddress: string, limit = 200): Promise<BlockSignature[]> {
		return this.query('validator_block_signatures', {
			consensus_address: `eq.${consensusAddress.toUpperCase()}`,
			order: 'height.desc',
			limit: String(limit),
		})
	}
}

// Standalone chain query functions

/**
 * Fetch account balances from the chain query service
 * @param chainQueryBaseUrl - Chain query base URL (e.g. "/api/chain" or "https://shared.example.com/chain/manifest-1")
 * @param address - The bech32 account address
 */
export async function getAccountBalances(chainQueryBaseUrl: string, address: string): Promise<TokenBalance[]> {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000)
		const response = await fetch(`${chainQueryBaseUrl}/balances/${address}`, {
			signal: controller.signal,
		})
		clearTimeout(timeoutId)
		if (!response.ok) return []
		const data: { balances: TokenBalance[] } = await response.json()
		return data.balances || []
	} catch {
		return []
	}
}

/**
 * Fetch live signing info for a validator from the chain query service
 * @param chainQueryBaseUrl - Chain query base URL
 * @param consAddress - The consensus address (bech32 cons prefix)
 */
export async function getValidatorSigningInfoLive(
	chainQueryBaseUrl: string,
	consAddress: string,
): Promise<ValidatorSigningInfo | null> {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000)
		const response = await fetch(`${chainQueryBaseUrl}/slashing/signing_info/${consAddress}`, {
			signal: controller.signal,
		})
		clearTimeout(timeoutId)
		if (!response.ok) return null
		const data = await response.json()
		return data.val_signing_info || null
	} catch {
		return null
	}
}

/**
 * Fetch slashing parameters from the chain query service
 * @param chainQueryBaseUrl - Chain query base URL
 */
export async function getSlashingParams(chainQueryBaseUrl: string): Promise<SlashingParams | null> {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000)
		const response = await fetch(`${chainQueryBaseUrl}/slashing/params`, {
			signal: controller.signal,
		})
		clearTimeout(timeoutId)
		if (!response.ok) return null
		const data = await response.json()
		return data.params || null
	} catch {
		return null
	}
}

// Singleton instance (fallback for code not yet migrated to ChainContext)
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}
const baseUrl = env.VITE_POSTGREST_URL || '/api'
export const api = new YaciClient({ baseUrl })
