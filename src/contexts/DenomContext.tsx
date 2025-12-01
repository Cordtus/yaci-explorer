import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
	initDenomService,
	isDenomServiceReady,
	resolveDenom,
	getDenomSymbol,
	type ResolvedDenom
} from '@/lib/denom-service'

interface DenomContextType {
	getDenomDisplay: (denom: string) => string
	resolve: (denom: string) => ResolvedDenom
	isLoading: boolean
}

const DenomContext = createContext<DenomContextType | undefined>(undefined)

/**
 * Denom resolution provider
 * Initializes the denom service and provides resolution functions to components
 */
export function DenomProvider({ children }: { children: ReactNode }) {
	const [isLoading, setIsLoading] = useState(!isDenomServiceReady())

	useEffect(() => {
		if (isDenomServiceReady()) {
			setIsLoading(false)
			return
		}

		initDenomService().then(() => {
			setIsLoading(false)
		})
	}, [])

	const value: DenomContextType = {
		getDenomDisplay: getDenomSymbol,
		resolve: resolveDenom,
		isLoading
	}

	return (
		<DenomContext.Provider value={value}>
			{children}
		</DenomContext.Provider>
	)
}

export function useDenom() {
	const context = useContext(DenomContext)
	if (context === undefined) {
		throw new Error('useDenom must be used within a DenomProvider')
	}
	return context
}
