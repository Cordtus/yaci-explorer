/**
 * Unified denomination resolution service
 * Integrates database metadata, static known denoms, and IBC resolution
 */

import { getDenomMetadata, type DenomMetadata } from './denom'
import { getIBCDenomFromCache } from './ibc-resolver'
import { getConfig } from './env'

export interface ResolvedDenom {
	denom: string
	symbol: string
	displayName: string
	decimals: number
	isIBC: boolean
	source: 'database' | 'static' | 'ibc-cache' | 'inferred'
}

// Database cache - populated on init
const dbCache: Map<string, { symbol: string; decimals?: number }> = new Map()
let initialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize the denom service by loading database metadata
 * Call this once at app startup after config is loaded
 */
export async function initDenomService(): Promise<void> {
	if (initialized) return
	if (initPromise) return initPromise

	initPromise = (async () => {
		try {
			const baseUrl = getConfig().apiUrl
			const response = await fetch(`${baseUrl}/denom_metadata?select=denom,symbol,decimals`)

			if (response.ok) {
				const metadata: Array<{ denom: string; symbol: string; decimals?: number }> = await response.json()
				for (const row of metadata) {
					dbCache.set(row.denom, { symbol: row.symbol, decimals: row.decimals })
				}
			}
		} catch (err) {
			console.warn('Failed to load denom metadata from database:', err)
		}
		initialized = true
	})()

	return initPromise
}

/**
 * Check if the service has been initialized
 */
export function isDenomServiceReady(): boolean {
	return initialized
}

/**
 * Resolve a denomination to its display information
 * Resolution priority:
 * 1. Database cache (most authoritative)
 * 2. IBC cache (for previously resolved IBC denoms)
 * 3. Static known denoms
 * 4. Inferred from denom string (u-prefix = 6 decimals, a-prefix = 18)
 */
export function resolveDenom(denom: string): ResolvedDenom {
	// 1. Check database cache first (most authoritative)
	const dbEntry = dbCache.get(denom)
	if (dbEntry) {
		return {
			denom,
			symbol: dbEntry.symbol,
			displayName: dbEntry.symbol,
			decimals: dbEntry.decimals ?? 6,
			isIBC: denom.startsWith('ibc/'),
			source: 'database'
		}
	}

	// 2. For IBC denoms, check localStorage cache
	if (denom.startsWith('ibc/')) {
		const hash = denom.slice(4)
		const ibcInfo = getIBCDenomFromCache(hash)
		if (ibcInfo) {
			return {
				denom,
				symbol: ibcInfo.symbol,
				displayName: ibcInfo.displayName,
				decimals: ibcInfo.decimals,
				isIBC: true,
				source: 'ibc-cache'
			}
		}
	}

	// 3. Use static metadata
	const staticMeta: DenomMetadata = getDenomMetadata(denom)

	// Determine source based on whether we got useful info
	const isUsefulStatic = staticMeta.symbol !== denom && staticMeta.symbol !== denom.toUpperCase()
	const source = isUsefulStatic ? 'static' : 'inferred'

	return {
		denom,
		symbol: staticMeta.symbol,
		displayName: staticMeta.displayName,
		decimals: staticMeta.decimals,
		isIBC: staticMeta.isIBC,
		source
	}
}

/**
 * Get just the display symbol for a denom
 * Convenience wrapper for common use case
 */
export function getDenomSymbol(denom: string): string {
	return resolveDenom(denom).symbol
}

/**
 * Get decimals for a denom
 */
export function getDenomDecimals(denom: string): number {
	return resolveDenom(denom).decimals
}

/**
 * Format an amount with proper decimal handling
 */
export function formatDenomAmount(
	amount: string | number,
	denom: string,
	options?: { maxDecimals?: number; abbreviated?: boolean }
): string {
	const resolved = resolveDenom(denom)
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

	if (Number.isNaN(numAmount)) return '0'

	const converted = numAmount / 10 ** resolved.decimals
	const maxDecimals = options?.maxDecimals ?? 2

	if (options?.abbreviated) {
		if (converted >= 1e9) return `${(converted / 1e9).toFixed(maxDecimals)}B`
		if (converted >= 1e6) return `${(converted / 1e6).toFixed(maxDecimals)}M`
		if (converted >= 1e3) return `${(converted / 1e3).toFixed(maxDecimals)}K`
	}

	return converted.toFixed(maxDecimals)
}

/**
 * Clear all caches (useful for testing or after chain reset)
 */
export function clearDenomCache(): void {
	dbCache.clear()
	initialized = false
	initPromise = null
}
