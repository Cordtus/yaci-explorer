import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import { getChainInfo, type ChainInfo } from '@/lib/chain-info'
import type { ChainFeatures } from '@/config/chains'

interface ChainContextType {
	chainInfo: ChainInfo | null
	isLoading: boolean
	hasFeature: (feature: keyof ChainFeatures) => boolean
}

const ChainContext = createContext<ChainContextType | undefined>(undefined)

/**
 * Chain info provider
 * Loads chain information at startup and exposes it to components
 */
export function ChainProvider({ children }: { children: ReactNode }) {
	const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		getChainInfo(api)
			.then(setChainInfo)
			.finally(() => setIsLoading(false))
	}, [])

	const hasFeature = (feature: keyof ChainFeatures): boolean => {
		if (!chainInfo) return false
		if (feature === 'customModules') {
			return Array.isArray(chainInfo.features.customModules) && chainInfo.features.customModules.length > 0
		}
		return chainInfo.features[feature] || false
	}

	const value: ChainContextType = {
		chainInfo,
		isLoading,
		hasFeature
	}

	return (
		<ChainContext.Provider value={value}>
			{children}
		</ChainContext.Provider>
	)
}

export function useChain() {
	const context = useContext(ChainContext)
	if (context === undefined) {
		throw new Error('useChain must be used within a ChainProvider')
	}
	return context
}
