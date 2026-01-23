/**
 * Configuration system for the block explorer
 * Supports runtime config.json + build-time defaults
 */

export interface AppConfig {
	apiUrl: string
	chainRestEndpoint?: string
	evmRpcEndpoint?: string
	appName: string
	appNameShort: string
	logoUrl?: string
	faviconUrl?: string
	primaryColor?: string
	accentColor?: string
	footerText?: string
	links?: {
		website?: string
		docs?: string
		github?: string
		discord?: string
		twitter?: string
	}
	// Query tuning
	queryStaleMs?: number
	queryGcMs?: number
	txPageSize?: number
	blocksPageSize?: number
	dashboardRefreshMs?: number
	dashboardItemCount?: number
	// Search
	searchAddressLimit?: number
	searchAutoNavigateSingle?: boolean
	// Analytics
	analyticsVolumeHours?: number
	analyticsVolumeRefreshMs?: number
	analyticsMessageSampleLimit?: number
	analyticsMessageTopN?: number
	analyticsMessageRefreshMs?: number
	analyticsEventSampleLimit?: number
	analyticsEventTopN?: number
	analyticsEventRefreshMs?: number
	analyticsBlockIntervalLookback?: number
	analyticsBlockIntervalRefreshMs?: number
	analyticsBlockIntervalMaxSeconds?: number
	analyticsNetworkBlockWindow?: number
	analyticsNetworkTxWindow?: number
	analyticsNetworkMsgWindow?: number
	analyticsNetworkRefreshMs?: number
}

// Default configuration - used when config.json is not available
// For Docker deployments, nginx proxies /api to PostgREST
const defaultConfig: AppConfig = {
	apiUrl: '/api',
	chainRestEndpoint: undefined,
	evmRpcEndpoint: undefined,
	appName: 'Block Explorer',
	appNameShort: 'Explorer',
	// Query defaults
	queryStaleMs: 10_000,
	queryGcMs: 300_000,
	txPageSize: 10,
	blocksPageSize: 10,
	dashboardRefreshMs: 6_000,
	dashboardItemCount: 5,
	// Search defaults
	searchAddressLimit: 20,
	searchAutoNavigateSingle: true,
	// Analytics defaults
	analyticsVolumeHours: 24,
	analyticsVolumeRefreshMs: 60_000,
	analyticsMessageSampleLimit: 10_000,
	analyticsMessageTopN: 10,
	analyticsMessageRefreshMs: 60_000,
	analyticsEventSampleLimit: 10_000,
	analyticsEventTopN: 10,
	analyticsEventRefreshMs: 60_000,
	analyticsBlockIntervalLookback: 100,
	analyticsBlockIntervalRefreshMs: 30_000,
	analyticsBlockIntervalMaxSeconds: 100,
	analyticsNetworkBlockWindow: 100,
	analyticsNetworkTxWindow: 1000,
	analyticsNetworkMsgWindow: 2000,
	analyticsNetworkRefreshMs: 10_000,
}

// Loaded configuration (populated at runtime)
let loadedConfig: AppConfig | null = null
let configPromise: Promise<AppConfig> | null = null

/**
 * Load configuration from /config.json or use defaults
 */
export async function loadConfig(): Promise<AppConfig> {
	if (loadedConfig) return loadedConfig

	if (configPromise) return configPromise

	configPromise = (async () => {
		try {
			const res = await fetch('/config.json')
			if (res.ok) {
				const json = await res.json()
				loadedConfig = { ...defaultConfig, ...json }
			} else {
				console.warn('config.json not found, using defaults')
				loadedConfig = defaultConfig
			}
		} catch {
			console.warn('Failed to load config.json, using defaults')
			loadedConfig = defaultConfig
		}
		return loadedConfig as AppConfig
	})()

	return configPromise
}

/**
 * Get config synchronously (returns defaults if not yet loaded)
 */
export function getConfig(): AppConfig {
	return loadedConfig || defaultConfig
}

/**
 * Legacy env getter for backward compatibility during migration
 * Maps old VITE_ keys to new config properties
 */
export function getEnv(key: string, fallback?: string): string | undefined {
	const config = getConfig()

	const mapping: Record<string, string | number | boolean | undefined> = {
		// Core
		'VITE_POSTGREST_URL': config.apiUrl,
		'VITE_CHAIN_REST_ENDPOINT': config.chainRestEndpoint,
		'VITE_EVM_RPC_ENDPOINT': config.evmRpcEndpoint,
		// Branding
		'VITE_APP_NAME': config.appName,
		'VITE_APP_NAME_SHORT': config.appNameShort,
		'VITE_LOGO_URL': config.logoUrl,
		'VITE_FAVICON_URL': config.faviconUrl,
		'VITE_PRIMARY_COLOR': config.primaryColor,
		'VITE_ACCENT_COLOR': config.accentColor,
		'VITE_FOOTER_TEXT': config.footerText,
		'VITE_LINK_WEBSITE': config.links?.website,
		'VITE_LINK_DOCS': config.links?.docs,
		'VITE_LINK_GITHUB': config.links?.github,
		'VITE_LINK_DISCORD': config.links?.discord,
		'VITE_LINK_TWITTER': config.links?.twitter,
		// Query tuning
		'VITE_QUERY_STALE_MS': config.queryStaleMs,
		'VITE_QUERY_GC_MS': config.queryGcMs,
		'VITE_TX_PAGE_SIZE': config.txPageSize,
		'VITE_BLOCKS_PAGE_SIZE': config.blocksPageSize,
		'VITE_DASHBOARD_REFRESH_MS': config.dashboardRefreshMs,
		'VITE_DASHBOARD_ITEM_COUNT': config.dashboardItemCount,
		// Search
		'VITE_SEARCH_ADDRESS_LIMIT': config.searchAddressLimit,
		'VITE_SEARCH_AUTO_NAVIGATE_SINGLE': config.searchAutoNavigateSingle,
		// Analytics
		'VITE_ANALYTICS_VOLUME_HOURS': config.analyticsVolumeHours,
		'VITE_ANALYTICS_VOLUME_REFRESH_MS': config.analyticsVolumeRefreshMs,
		'VITE_ANALYTICS_MESSAGE_SAMPLE_LIMIT': config.analyticsMessageSampleLimit,
		'VITE_ANALYTICS_MESSAGE_TOPN': config.analyticsMessageTopN,
		'VITE_ANALYTICS_MESSAGE_REFRESH_MS': config.analyticsMessageRefreshMs,
		'VITE_ANALYTICS_EVENT_SAMPLE_LIMIT': config.analyticsEventSampleLimit,
		'VITE_ANALYTICS_EVENT_TOPN': config.analyticsEventTopN,
		'VITE_ANALYTICS_EVENT_REFRESH_MS': config.analyticsEventRefreshMs,
		'VITE_ANALYTICS_BLOCK_INTERVAL_LOOKBACK': config.analyticsBlockIntervalLookback,
		'VITE_ANALYTICS_BLOCK_INTERVAL_REFRESH_MS': config.analyticsBlockIntervalRefreshMs,
		'VITE_ANALYTICS_BLOCK_INTERVAL_MAX_SECONDS': config.analyticsBlockIntervalMaxSeconds,
		'VITE_ANALYTICS_NETWORK_BLOCK_WINDOW': config.analyticsNetworkBlockWindow,
		'VITE_ANALYTICS_NETWORK_TX_WINDOW': config.analyticsNetworkTxWindow,
		'VITE_ANALYTICS_NETWORK_MSG_WINDOW': config.analyticsNetworkMsgWindow,
		'VITE_ANALYTICS_NETWORK_REFRESH_MS': config.analyticsNetworkRefreshMs,
	}

	const value = mapping[key]
	if (value === undefined) return fallback
	return String(value)
}

// Backward compat proxy - allows env.VITE_* syntax
export const env = new Proxy({} as Record<string, string | undefined>, {
	get(_, key: string) {
		return getEnv(key)
	}
})
