/**
 * Chain context: central state for the selected chain
 * Provides chain config, API client, and chain switching
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getChainConfig, resolveFeatures, type ChainConfig, type ChainFeatures } from '@/config/chains'
import { YaciClient } from '@/lib/api'
import {
	getConfig,
	getDefaultChainId,
	getRuntimeChainConfig,
	getRuntimeChainIds,
	type RuntimeChainConfig,
} from '@/lib/env'
import { applyChainTheme } from '@/lib/theme'

export interface ChainInfo {
	chainId: string
	displayDenom: string
	baseDenom: string
	decimals: number
	bech32Prefix: string
	features: ChainFeatures
}

interface ChainContextValue {
	selectedChainId: string
	chainConfig: ChainConfig
	chainInfo: ChainInfo
	api: YaciClient
	/** Base URL for chain query service gRPC proxy (e.g. "/api/chain" or "https://shared.example.com/chain/manifest-1") */
	chainQueryBaseUrl: string
	switchChain: (chainId: string) => void
	availableChains: Array<{ id: string; name: string }>
	/** Whether the selected chain enables a given feature flag (e.g. "evm", "governance") */
	hasFeature: (feature: string) => boolean
}

const ChainContext = createContext<ChainContextValue | null>(null)

const STORAGE_KEY = 'yaci-selected-chain'

/** Resolve the API URL for a chain, checking runtime config first */
function resolveApiUrl(chainId: string): string {
	const runtimeChain = getRuntimeChainConfig(chainId)
	if (runtimeChain?.apiUrl) return runtimeChain.apiUrl

	// Fall back to env var or default
	const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}
	return env.VITE_POSTGREST_URL || '/api'
}

/**
 * Resolve the chain query base URL for gRPC proxy calls.
 * If chainQueryUrl is set in runtime config, use it directly (shared model).
 * Otherwise, derive from apiUrl (per-deployment model): {apiUrl}/chain
 */
function resolveChainQueryBaseUrl(chainId: string): string {
	const runtimeChain = getRuntimeChainConfig(chainId)

	// Shared chain query service: URL already includes chain ID
	if (runtimeChain?.chainQueryUrl) {
		return runtimeChain.chainQueryUrl.replace(/\/$/, '')
	}

	// Per-deployment model: chain query is at {apiUrl}/chain
	const apiUrl = resolveApiUrl(chainId)
	return `${apiUrl}/chain`
}

/** Merge runtime chain config with compile-time defaults */
function mergeChainConfig(chainId: string): ChainConfig {
	const staticConfig = getChainConfig(chainId)
	const runtimeChain = getRuntimeChainConfig(chainId)

	if (!runtimeChain) return staticConfig

	return {
		...staticConfig,
		name: runtimeChain.name || staticConfig.name,
		features: {
			...staticConfig.features,
			...runtimeChain.features,
		},
	}
}

/** Build a ChainInfo from a merged ChainConfig */
function buildChainInfo(chainId: string, config: ChainConfig): ChainInfo {
	return {
		chainId,
		displayDenom: config.nativeSymbol,
		baseDenom: config.nativeDenom,
		decimals: config.decimals,
		bech32Prefix: config.bech32Prefix,
		features: resolveFeatures(config.features),
	}
}

/**
 * Overlay the backend's advertised modules (`api.chain_features`) onto config
 * defaults. When the backend advertises a set, it is authoritative; when it has
 * no row (or the fetch fails) the config.json/static flags stand.
 */
function applyServerFeatures(info: ChainInfo, serverFeatures: string[] | null): ChainInfo {
	if (!serverFeatures) return info

	const features: ChainFeatures = { ...info.features }
	for (const key of Object.keys(features)) {
		if (typeof features[key] === 'boolean') {
			features[key] = serverFeatures.includes(key)
		}
	}
	for (const feature of serverFeatures) {
		if (typeof features[feature] === 'undefined') features[feature] = true
	}
	return { ...info, features }
}

/** Determine initial chain: localStorage > runtime default > first runtime chain */
function getInitialChainId(): string {
	const stored = localStorage.getItem(STORAGE_KEY)
	const runtimeIds = getRuntimeChainIds()

	// Validate stored chain still exists in config
	if (stored && runtimeIds.includes(stored)) return stored

	const defaultId = getDefaultChainId()
	if (runtimeIds.includes(defaultId)) return defaultId
	if (runtimeIds.length > 0) return runtimeIds[0]

	return defaultId
}

export function ChainProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient()
	const [selectedChainId, setSelectedChainId] = useState(getInitialChainId)

	const chainConfig = useMemo(() => mergeChainConfig(selectedChainId), [selectedChainId])
	const baseChainInfo = useMemo(() => buildChainInfo(selectedChainId, chainConfig), [selectedChainId, chainConfig])

	const api = useMemo(() => {
		const apiUrl = resolveApiUrl(selectedChainId)
		return new YaciClient({ baseUrl: apiUrl })
	}, [selectedChainId])

	// Modules this deployment advertises via api.chain_features
	const [serverFeatures, setServerFeatures] = useState<string[] | null>(null)

	useEffect(() => {
		let cancelled = false
		setServerFeatures(null)
		api
			.getChainFeatures(selectedChainId)
			.then(features => {
				if (!cancelled) setServerFeatures(features)
			})
			.catch(() => {
				if (!cancelled) setServerFeatures(null)
			})
		return () => {
			cancelled = true
		}
	}, [api, selectedChainId])

	const chainInfo = useMemo(
		() => applyServerFeatures(baseChainInfo, serverFeatures),
		[baseChainInfo, serverFeatures]
	)

	const chainQueryBaseUrl = useMemo(() => resolveChainQueryBaseUrl(selectedChainId), [selectedChainId])

	const availableChains = useMemo(() => {
		const runtimeConfig = getConfig()
		const chainIds = Object.keys(runtimeConfig.chains)

		// If no chains in runtime config, show just the default
		if (chainIds.length === 0) {
			const defaultId = getDefaultChainId()
			const config = getChainConfig(defaultId)
			return [{ id: defaultId, name: config.name }]
		}

		return chainIds.map(id => ({
			id,
			name: runtimeConfig.chains[id].name || getChainConfig(id).name,
		}))
	}, [])

	const hasFeature = useCallback(
		(feature: string) => Boolean(chainInfo.features[feature]),
		[chainInfo.features]
	)

	const switchChain = useCallback((chainId: string) => {
		if (chainId === selectedChainId) return

		setSelectedChainId(chainId)
		localStorage.setItem(STORAGE_KEY, chainId)

		// Clear all query caches so stale data from old chain doesn't show
		queryClient.clear()

		// Update document title
		const config = mergeChainConfig(chainId)
		const branding = getConfig().branding
		document.title = `${branding.appName} - ${config.name}`
	}, [selectedChainId, queryClient])

	// Apply chain theme on mount and chain switch
	useEffect(() => {
		const runtimeChain = getRuntimeChainConfig(selectedChainId)
		applyChainTheme(runtimeChain?.theme)

		const branding = getConfig().branding
		document.title = `${branding.appName} - ${chainConfig.name}`
	}, [selectedChainId, chainConfig.name])

	const value = useMemo<ChainContextValue>(() => ({
		selectedChainId,
		chainConfig,
		chainInfo,
		api,
		chainQueryBaseUrl,
		switchChain,
		availableChains,
		hasFeature,
	}), [selectedChainId, chainConfig, chainInfo, api, chainQueryBaseUrl, switchChain, availableChains, hasFeature])

	return (
		<ChainContext.Provider value={value}>
			{children}
		</ChainContext.Provider>
	)
}

/** Access the chain context (must be inside ChainProvider) */
export function useChain(): ChainContextValue {
	const ctx = useContext(ChainContext)
	if (!ctx) {
		throw new Error('useChain must be used within a ChainProvider')
	}
	return ctx
}
