/**
 * Configuration system for the block explorer
 * Supports runtime config.json + build-time defaults
 */

export interface AppConfig {
	apiUrl: string
	chainRestEndpoint?: string
	evmRpcEndpoint?: string
	evmEnabled?: boolean
	ibcEnabled?: boolean
	wasmEnabled?: boolean
	appName: string
	appNameShort: string
	queries?: {
		staleTimeMs?: number
		gcTimeMs?: number
	}
	dashboard?: {
		refetchIntervalMs?: number
		itemCount?: number
	}
	transactions?: {
		pageSize?: number
	}
	blocks?: {
		pageSize?: number
	}
	search?: {
		addressResultLimit?: number
		autoNavigateSingle?: boolean
	}
	analytics?: {
		transactionVolumeHours?: number
		transactionVolumeRefetchMs?: number
		messageSampleLimit?: number
		messageTopN?: number
		messageRefetchMs?: number
		eventSampleLimit?: number
		eventTopN?: number
		eventRefetchMs?: number
		blockIntervalLookback?: number
		blockIntervalRefetchMs?: number
		blockIntervalMaxSeconds?: number
		networkBlocksWindow?: number
		networkTxWindow?: number
		networkMessageWindow?: number
		networkRefetchMs?: number
	}
	resetNotice?: {
		enabled?: boolean
		refetchIntervalMs?: number
		hashCheckHeight?: number
	}
	branding?: {
		logoUrl?: string
		faviconUrl?: string
		primaryColor?: string
		accentColor?: string
		footerText?: string
	}
	links?: {
		website?: string
		docs?: string
		github?: string
		discord?: string
		twitter?: string
	}
}

// Default configuration - used when config.json is not available
// For production, set apiUrl to your PostgREST endpoint
const defaultConfig: AppConfig = {
	apiUrl: 'https://yaci-explorer-apis.fly.dev',
	chainRestEndpoint: undefined,
	evmRpcEndpoint: undefined,
	appName: 'Republic Explorer',
	appNameShort: 'Explorer',
	queries: {
		staleTimeMs: 10_000,
		gcTimeMs: 300_000
	},
	dashboard: {
		refetchIntervalMs: 6_000,
		itemCount: 5
	},
	transactions: {
		pageSize: 10
	},
	blocks: {
		pageSize: 10
	},
	search: {
		addressResultLimit: 20,
		autoNavigateSingle: true
	},
	analytics: {
		transactionVolumeHours: 24,
		transactionVolumeRefetchMs: 60_000,
		messageSampleLimit: 10_000,
		messageTopN: 10,
		messageRefetchMs: 60_000,
		eventSampleLimit: 10_000,
		eventTopN: 10,
		eventRefetchMs: 60_000,
		blockIntervalLookback: 100,
		blockIntervalRefetchMs: 30_000,
		blockIntervalMaxSeconds: 100,
		networkBlocksWindow: 100,
		networkTxWindow: 1000,
		networkMessageWindow: 2000,
		networkRefetchMs: 10_000
	},
	resetNotice: {
		enabled: true,
		refetchIntervalMs: 30_000,
		hashCheckHeight: 5
	},
	branding: {
		logoUrl: undefined,
		faviconUrl: undefined,
		primaryColor: undefined,
		accentColor: undefined,
		footerText: undefined
	},
	links: {
		website: undefined,
		docs: undefined,
		github: undefined,
		discord: undefined,
		twitter: undefined
	}
}

// Loaded configuration (populated at runtime)
let loadedConfig: AppConfig | null = null
let configPromise: Promise<AppConfig> | null = null

/**
 * Deep merge helper for nested objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
	const result = { ...target } as T
	for (const key in source) {
		const sourceValue = source[key]
		const targetValue = result[key]
		if (
			sourceValue &&
			typeof sourceValue === 'object' &&
			!Array.isArray(sourceValue) &&
			targetValue &&
			typeof targetValue === 'object' &&
			!Array.isArray(targetValue)
		) {
			result[key] = deepMerge(targetValue as any, sourceValue) as any
		} else if (sourceValue !== undefined) {
			result[key] = sourceValue as any
		}
	}
	return result
}

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
				loadedConfig = deepMerge(defaultConfig, json)
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
