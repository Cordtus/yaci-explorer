/**
 * Runtime configuration loader
 * Fetches /config.json at startup and deep-merges with defaults
 */

export interface ChainTheme {
	accentColor: string
	accentColorFg: string
	accentColorSubtle: string
	logo?: string
}

export interface ChainFeatureFlags {
	evm?: boolean
	ibc?: boolean
	wasm?: boolean
}

export interface RuntimeChainConfig {
	name: string
	apiUrl: string
	chainQueryUrl?: string
	features?: ChainFeatureFlags
	theme?: ChainTheme
}

export interface BrandingConfig {
	appName: string
	footerText?: string
	links?: {
		website?: string
		docs?: string
		github?: string
		discord?: string
		twitter?: string
	}
}

export interface QueryConfig {
	staleTimeMs: number
	gcTimeMs: number
}

export interface RuntimeConfig {
	defaultChainId: string
	chains: Record<string, RuntimeChainConfig>
	branding: BrandingConfig
	queries: QueryConfig
}

const DEFAULT_CONFIG: RuntimeConfig = {
	defaultChainId: 'manifest-1',
	chains: {},
	branding: {
		appName: 'Yaci Explorer',
		footerText: '',
	},
	queries: {
		staleTimeMs: 10_000,
		gcTimeMs: 300_000,
	},
}

let loadedConfig: RuntimeConfig | null = null

/** Deep merge source into target (source values win) */
function deepMerge(target: any, source: any): any {
	if (!source || typeof source !== 'object') return target
	const result = { ...target }
	for (const key of Object.keys(source)) {
		const srcVal = source[key]
		const tgtVal = target[key]
		if (
			srcVal !== null &&
			srcVal !== undefined &&
			typeof srcVal === 'object' &&
			!Array.isArray(srcVal) &&
			typeof tgtVal === 'object' &&
			tgtVal !== null &&
			!Array.isArray(tgtVal)
		) {
			result[key] = deepMerge(tgtVal, srcVal)
		} else if (srcVal !== undefined) {
			result[key] = srcVal
		}
	}
	return result
}

/**
 * Load runtime config from /config.json
 * Falls back gracefully to defaults if fetch fails
 */
export async function loadConfig(): Promise<RuntimeConfig> {
	if (loadedConfig) return loadedConfig

	try {
		const res = await fetch('/config.json')
		if (res.ok) {
			const userConfig = await res.json() as Partial<RuntimeConfig>
			loadedConfig = deepMerge(DEFAULT_CONFIG, userConfig)
		} else {
			console.warn(`config.json returned ${res.status}, using defaults`)
			loadedConfig = { ...DEFAULT_CONFIG }
		}
	} catch {
		console.warn('Failed to fetch config.json, using defaults')
		loadedConfig = { ...DEFAULT_CONFIG }
	}

	return loadedConfig!
}

/**
 * Synchronous accessor for already-loaded config
 * Must call loadConfig() first during app bootstrap
 */
export function getConfig(): RuntimeConfig {
	if (!loadedConfig) {
		console.warn('getConfig() called before loadConfig() -- returning defaults')
		return DEFAULT_CONFIG
	}
	return loadedConfig
}

/** Get the default chain ID from config */
export function getDefaultChainId(): string {
	return getConfig().defaultChainId
}

/** Get all chain IDs defined in runtime config */
export function getRuntimeChainIds(): string[] {
	return Object.keys(getConfig().chains)
}

/** Get a specific chain's runtime config (if defined) */
export function getRuntimeChainConfig(chainId: string): RuntimeChainConfig | undefined {
	return getConfig().chains[chainId]
}
