/**
 * IBC denom resolution utilities
 * Queries the chain's IBC module to resolve IBC denoms dynamically
 */

import { extractIBCHash } from './denom'
import { getEnv } from './env'

export interface IBCChannelInfo {
	channelId: string
	portId: string
	counterpartyChannelId: string
	counterpartyPortId: string
	counterpartyChainId: string
	connectionId: string
	state: string
}

export interface IBCDenomInfo {
	denom: string
	baseDenom: string
	displayName: string
	symbol: string
	decimals: number
	path: string
	sourceChainId: string
	ibcHash: string
}

// Browser storage keys for IBC cache
export const IBC_CACHE_KEY = 'yaci_ibc_denom_cache'
export const CHANNEL_CACHE_KEY = 'yaci_ibc_channel_cache'

/**
 * Get the chain's REST API endpoint from environment
 */
function getChainRestEndpoint(): string | undefined {
	const endpoint = getEnv('VITE_CHAIN_REST_ENDPOINT')
	return endpoint
}

/**
 * Query channel information from the chain's IBC module
 */
export async function queryChannelInfo(
	channelId: string,
	portId: string = 'transfer'
): Promise<IBCChannelInfo> {
	// Check cache first
	const cached = getChannelFromCache(channelId, portId)
	if (cached) {
		return cached
	}

	const restEndpoint = getChainRestEndpoint()

	// Query channel endpoint
	const channelUrl = `${restEndpoint}/ibc/core/channel/v1/channels/${channelId}/ports/${portId}`
	const channelResp = await fetch(channelUrl)

	if (!channelResp.ok) {
		throw new Error(`Failed to query channel ${channelId}: ${channelResp.statusText}`)
	}

	const channelData = await channelResp.json()
	const channel = channelData.channel

	// Query client state to get counterparty chain ID
	const clientStateUrl = `${restEndpoint}/ibc/core/channel/v1/channels/${channelId}/ports/${portId}/client_state`
	const clientResp = await fetch(clientStateUrl)

	if (!clientResp.ok) {
		throw new Error(`Failed to query client state for ${channelId}: ${clientResp.statusText}`)
	}

	const clientData = await clientResp.json()
	const chainId = clientData.identified_client_state?.client_state?.chain_id

	if (!chainId) {
		throw new Error(`Could not extract chain ID from client state for ${channelId}`)
	}

	const info: IBCChannelInfo = {
		channelId,
		portId,
		counterpartyChannelId: channel.counterparty.channel_id,
		counterpartyPortId: channel.counterparty.port_id || 'transfer',
		counterpartyChainId: chainId,
		connectionId: channel.connection_hops?.[0] || '',
		state: channel.state || 'STATE_OPEN',
	}

	// Cache the result
	cacheChannelInfo(info)

	return info
}

/**
 * Resolve an IBC denom by extracting path from fungible_token_packet events
 * and querying the chain for channel information
 */
export async function resolveIBCDenom(ibcDenom: string): Promise<IBCDenomInfo | null> {
	const hash = extractIBCHash(ibcDenom)
	if (!hash) {
		return null
	}

	// Check cache first
	const cached = getIBCDenomFromCache(hash)
	if (cached) {
		return cached
	}

	// We cannot resolve without knowing the channel
	// This requires extracting from transaction events
	// For now, return null - the transaction display will need to extract this
	// from the fungible_token_packet event attributes
	return null
}

/**
 * Resolve IBC denom from transaction event data
 * Extracts channel ID and base denom from fungible_token_packet events
 */
export async function resolveIBCDenomFromEvent(
	packetData: {
		denom: string
		amount: string
		sender: string
		receiver: string
	},
	srcChannel: string,
	srcPort: string = 'transfer',
	dstChannel: string,
	dstPort: string = 'transfer'
): Promise<IBCDenomInfo | null> {
	try {
		// Get channel info for our receiving channel
		const channelInfo = await queryChannelInfo(dstChannel, dstPort)

		// Calculate IBC denom hash
		const path = `${srcPort}/${srcChannel}/${packetData.denom}`
		const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(path))
		const hashArray = Array.from(new Uint8Array(hashBytes))
		const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
		const ibcDenom = `ibc/${hashHex}`

		// Try to get enhanced info for base denom
		const baseDenomInfo = await getBaseDenomInfo(packetData.denom)

		const info: IBCDenomInfo = {
			denom: ibcDenom,
			baseDenom: packetData.denom,
			displayName: baseDenomInfo?.displayName || `${extractSymbol(packetData.denom)} (from ${channelInfo.counterpartyChainId})`,
			symbol: baseDenomInfo?.symbol || extractSymbol(packetData.denom),
			decimals: baseDenomInfo?.decimals || guessDecimals(packetData.denom),
			path,
			sourceChainId: channelInfo.counterpartyChainId,
			ibcHash: hashHex,
		}

		// Cache the result
		cacheIBCDenom(info)

		return info
	} catch (error) {
		console.error('Failed to resolve IBC denom from event:', error)
		return null
	}
}

/**
 * Extract symbol from base denom
 */
function extractSymbol(baseDenom: string): string {
	// Remove common prefixes
	if (baseDenom.startsWith('u')) {
		return baseDenom.slice(1).toUpperCase()
	}
	if (baseDenom.startsWith('a')) {
		return baseDenom.slice(1).toUpperCase()
	}
	return baseDenom.toUpperCase()
}

/**
 * Guess decimals from base denom prefix
 */
function guessDecimals(baseDenom: string): number {
	if (baseDenom.startsWith('u')) return 6 // micro
	if (baseDenom.startsWith('a')) return 18 // atto (EVM)
	return 6 // default
}

/**
 * Get enhanced base denom info (optional)
 * This could query an external registry or local config
 */
async function getBaseDenomInfo(_baseDenom: string): Promise<{ displayName: string; symbol: string; decimals: number } | null> {
	// Could query chain registry or other source
	// For now, return null to use defaults
	return null
}

// Cache management functions

function getChannelFromCache(channelId: string, portId: string): IBCChannelInfo | null {
	try {
		const cache = localStorage.getItem(CHANNEL_CACHE_KEY)
		if (!cache) return null

		const parsed = JSON.parse(cache)
		const key = `${portId}/${channelId}`
		return parsed[key] || null
	} catch {
		return null
	}
}

function cacheChannelInfo(info: IBCChannelInfo): void {
	try {
		const cache = localStorage.getItem(CHANNEL_CACHE_KEY)
		const parsed = cache ? JSON.parse(cache) : {}
		const key = `${info.portId}/${info.channelId}`
		parsed[key] = info
		localStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify(parsed))
	} catch (error) {
		console.warn('Failed to cache channel info:', error)
	}
}

export function getIBCDenomFromCache(hash: string): IBCDenomInfo | null {
	try {
		const cache = localStorage.getItem(IBC_CACHE_KEY)
		if (!cache) return null

		const parsed = JSON.parse(cache)
		return parsed[hash] || null
	} catch {
		return null
	}
}

function cacheIBCDenom(info: IBCDenomInfo): void {
	try {
		const cache = localStorage.getItem(IBC_CACHE_KEY)
		const parsed = cache ? JSON.parse(cache) : {}
		parsed[info.ibcHash] = info
		localStorage.setItem(IBC_CACHE_KEY, JSON.stringify(parsed))
	} catch (error) {
		console.warn('Failed to cache IBC denom:', error)
	}
}

/**
 * Clear all IBC caches
 */
export function clearIBCCache(): void {
	try {
		localStorage.removeItem(IBC_CACHE_KEY)
		localStorage.removeItem(CHANNEL_CACHE_KEY)
	} catch (error) {
		console.warn('Failed to clear IBC cache:', error)
	}
}
