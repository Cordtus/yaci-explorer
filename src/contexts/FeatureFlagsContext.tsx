import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { loadConfig } from '@/lib/env'

interface FeatureFlags {
	evmEnabled: boolean
	ibcEnabled: boolean
	wasmEnabled: boolean
}

interface FeatureFlagsContextValue extends FeatureFlags {
	isLoading: boolean
}

const defaultFlags: FeatureFlags = {
	evmEnabled: false,
	ibcEnabled: true,
	wasmEnabled: true,
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
	...defaultFlags,
	isLoading: true,
})

/**
 * Provider for feature flags loaded from config.json
 * Enables/disables features like EVM, IBC, and WASM based on configuration
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
	const [flags, setFlags] = useState<FeatureFlags>(defaultFlags)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		loadConfig().then((config) => {
			setFlags({
				evmEnabled: config.evmEnabled ?? defaultFlags.evmEnabled,
				ibcEnabled: config.ibcEnabled ?? defaultFlags.ibcEnabled,
				wasmEnabled: config.wasmEnabled ?? defaultFlags.wasmEnabled,
			})
			setIsLoading(false)
		})
	}, [])

	return (
		<FeatureFlagsContext.Provider value={{ ...flags, isLoading }}>
			{children}
		</FeatureFlagsContext.Provider>
	)
}

/**
 * Hook to access feature flags
 * @returns Feature flags and loading state
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
	return useContext(FeatureFlagsContext)
}
