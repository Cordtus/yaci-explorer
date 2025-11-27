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
}

// Default configuration - used when config.json is not available
// For production, set apiUrl to your PostgREST endpoint
const defaultConfig: AppConfig = {
	apiUrl: 'https://yaci-explorer-apis.fly.dev',
	chainRestEndpoint: undefined,
	evmRpcEndpoint: undefined,
	appName: 'Republic Explorer',
	appNameShort: 'Explorer'
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
		return loadedConfig!
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
 * Legacy env getter for backward compatibility
 */
export function getEnv(key: string, fallback?: string): string | undefined {
	const config = getConfig()
	const mapping: Record<string, string | undefined> = {
		'VITE_POSTGREST_URL': config.apiUrl,
		'VITE_CHAIN_REST_ENDPOINT': config.chainRestEndpoint,
		'VITE_EVM_RPC_ENDPOINT': config.evmRpcEndpoint,
		'VITE_APP_NAME': config.appName,
		'VITE_APP_NAME_SHORT': config.appNameShort
	}
	return mapping[key] ?? fallback
}

// Backward compat export
export const env = new Proxy({} as Record<string, string | undefined>, {
	get(_, key: string) {
		return getEnv(key)
	}
})
