/**
 * Block Explorer API Client
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
	fee: TransactionFee | null
	memo: string | null
	error: string | null
	height: number | null  // null for ingest error transactions
	timestamp: string | null  // null for ingest error transactions
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

export interface IbcConnection {
	channel_id: string
	port_id: string
	connection_id: string | null
	client_id: string | null
	counterparty_chain_id: string | null
	counterparty_channel_id: string | null
	counterparty_port_id: string | null
	counterparty_client_id: string | null
	counterparty_connection_id: string | null
	state: string | null
	ordering: string | null
	client_status: string | null
	is_active: boolean
	updated_at: string
}

export interface IbcDenomTrace {
	ibc_denom: string
	base_denom: string
	path: string
	source_channel: string | null
	source_chain_id: string | null
	symbol: string | null
	decimals: number
	updated_at: string
}

export interface IbcDenomResolution {
	ibc_denom: string
	base_denom: string
	path: string
	source_channel: string | null
	source_chain_id: string | null
	symbol: string | null
	decimals: number
	route: {
		channel_id: string | null
		connection_id: string | null
		client_id: string | null
		counterparty_channel_id: string | null
		counterparty_connection_id: string | null
		counterparty_client_id: string | null
	}
}

export interface IbcChainSummary {
	chain_id: string
	channel_count: number
	open_channels: number
	active_channels: number
}

export interface IbcStats {
	outgoing_transfers: number
	incoming_transfers: number
	completed_transfers: number
	timed_out_transfers: number
	relayer_updates: number
	total_channels: number
	open_channels: number
	active_channels: number
	connected_chains: number
	total_denoms: number
}

export interface IbcTransfer {
	tx_hash: string
	height: number
	timestamp: string
	direction: 'outgoing' | 'incoming' | 'other'
	sender: string
	receiver: string | null
	source_channel: string | null
	token_denom: string | null
	token_amount: string | null
	resolved_denom: {
		symbol: string
		decimals: number
		base_denom: string
	} | null
	counterparty_chain: string | null
	success: boolean
}

export interface IbcChannelActivity {
	channel_id: string
	transfer_count: number
	successful_transfers: number
	counterparty_chain_id: string | null
	state: string | null
	client_status: string | null
}

export interface IbcVolumeDataPoint {
	hour: string
	outgoing_count: number
	incoming_count: number
	outgoing_volume: number
	incoming_volume: number
}

export interface IbcVolumeTimeSeries {
	hours: number
	channel_filter: string | null
	data: IbcVolumeDataPoint[]
	channels: string[]
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
			lastCommit?: {
				signatures: Array<{
					validatorAddress?: string
					validator_address?: string
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
	last_snapshot_time: string | null
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
		const urlStr = `${this.baseUrl}/rpc/${fn}`
		const url = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
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
		const urlStr = `${this.baseUrl}/${table}`
		const url = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
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

	async getFeeRevenue(): Promise<Array<{ denom: string; total_amount: string }>> {
		return this.query('fee_revenue')
	}

	// Alias for backward compatibility
	async getFeeRevenueOverTime(): Promise<Array<{ denom: string; total_amount: string }>> {
		return this.getFeeRevenue()
	}

	async getTotalFeeRevenue(): Promise<Record<string, string | number>> {
		const result = await this.getFeeRevenue()
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
		verified: boolean
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

	async getChainParams(): Promise<Record<string, string>> {
		return this.rpc('get_chain_params', {})
	}

	async getIbcConnections(
		limit = 50,
		offset = 0,
		chainId?: string,
		state?: string
	): Promise<PaginatedResponse<IbcConnection>> {
		return this.rpc('get_ibc_connections', {
			_limit: limit,
			_offset: offset,
			_chain_id: chainId,
			_state: state
		})
	}

async getIbcConnection(channelId: string, portId = 'transfer'): Promise<IbcConnection | null> {
		return this.rpc('get_ibc_connection', {
			_channel_id: channelId,
			_port_id: portId
		})
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
			last_snapshot_time: string | null
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
			last_updated: row.last_updated,
			last_snapshot_time: row.last_snapshot_time
		}
	}

	async getProposalSnapshots(proposalId: number): Promise<ProposalSnapshot[]> {
		return this.query('governance_snapshots', {
			proposal_id: `eq.${proposalId}`,
			order: 'snapshot_time.desc'
		})
	}

	async getIbcDenomTraces(
		limit = 50,
		offset = 0,
		baseDenom?: string
	): Promise<PaginatedResponse<IbcDenomTrace>> {
		return this.rpc('get_ibc_denom_traces', {
			_limit: limit,
			_offset: offset,
			_base_denom: baseDenom
		})
	}

async resolveIbcDenom(ibcDenom: string): Promise<IbcDenomResolution | null> {
		return this.rpc('resolve_ibc_denom', { _ibc_denom: ibcDenom })
	}

	async getIbcChains(): Promise<IbcChainSummary[]> {
		return this.rpc('get_ibc_chains', {})
	}

	async getIbcStats(): Promise<IbcStats> {
		return this.rpc('get_ibc_stats', {})
	}

	async getIbcTransfers(
		limit = 20,
		offset = 0,
		direction?: 'outgoing' | 'incoming'
	): Promise<PaginatedResponse<IbcTransfer>> {
		return this.rpc('get_ibc_transfers', {
			_limit: limit,
			_offset: offset,
			_direction: direction
		})
	}

	async getIbcTransfersByAddress(
		address: string,
		limit = 20,
		offset = 0
	): Promise<PaginatedResponse<IbcTransfer>> {
		return this.rpc('get_ibc_transfers_by_address', {
			_address: address,
			_limit: limit,
			_offset: offset
		})
	}

	async getIbcChannelActivity(): Promise<IbcChannelActivity[]> {
		return this.rpc('get_ibc_channel_activity', {})
	}

	async getIbcVolumeTimeSeries(
		hours = 24,
		channel?: string
	): Promise<IbcVolumeTimeSeries> {
		return this.rpc('get_ibc_volume_timeseries', {
			_hours: hours,
			_channel: channel
		})
	}

}

// Factory function to create API client
export function createApiClient(baseUrl: string): YaciClient {
	return new YaciClient({ baseUrl })
}

import { getConfig } from './env'

// Lazy-initialized singleton - deferred until first access to ensure config is loaded
let _apiInstance: YaciClient | null = null

function getApiInstance(): YaciClient {
	if (!_apiInstance) {
		const baseUrl = getConfig().apiUrl
		_apiInstance = new YaciClient({ baseUrl })
	}
	return _apiInstance
}

// Proxy that defers to lazy instance - allows import-time reference without immediate instantiation
export const api = new Proxy({} as YaciClient, {
	get(_, prop: keyof YaciClient) {
		return Reflect.get(getApiInstance(), prop)
	}
})

// Chain query types
export interface TokenBalance {
	denom: string
	amount: string
}

export interface BalancesResponse {
	balances: TokenBalance[]
}

/**
 * Fetch account balances via middleware's chain proxy endpoint
 * Uses the /chain/balances/{address} endpoint which proxies to chain gRPC
 */
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
