/**
 * React Query hooks for IBC denom resolution
 * Provides caching and automatic refetching for IBC denom metadata
 */

import { useQuery } from '@tanstack/react-query'
import { resolveIBCDenom, queryChannelInfo, type IBCDenomInfo, type IBCChannelInfo } from '@/lib/ibc-resolver'

/**
 * Hook to resolve an IBC denom
 * Returns cached data from browser storage or queries the chain
 */
export function useIBCDenomResolver(ibcDenom: string | null) {
	return useQuery({
		queryKey: ['ibc-denom', ibcDenom],
		queryFn: () => {
			if (!ibcDenom) return null
			return resolveIBCDenom(ibcDenom)
		},
		enabled: !!ibcDenom && ibcDenom.startsWith('ibc/'),
		staleTime: Infinity, // IBC denoms don't change
		gcTime: 24 * 60 * 60 * 1000, // 24 hours
	})
}

/**
 * Hook to query IBC channel information
 */
export function useIBCChannelInfo(channelId: string | null, portId: string = 'transfer') {
	return useQuery({
		queryKey: ['ibc-channel', channelId, portId],
		queryFn: () => {
			if (!channelId) return null
			return queryChannelInfo(channelId, portId)
		},
		enabled: !!channelId,
		staleTime: 60 * 60 * 1000, // 1 hour - channels rarely change
		gcTime: 24 * 60 * 60 * 1000, // 24 hours
	})
}

/**
 * Batch resolver for multiple IBC denoms
 */
export function useIBCDenomResolverBatch(denoms: string[]) {
	const ibcDenoms = denoms.filter((d) => d.startsWith('ibc/'))

	const queries = useQuery({
		queryKey: ['ibc-denoms-batch', ibcDenoms],
		queryFn: async () => {
			const results: Record<string, IBCDenomInfo | null> = {}
			for (const denom of ibcDenoms) {
				results[denom] = await resolveIBCDenom(denom)
			}
			return results
		},
		enabled: ibcDenoms.length > 0,
		staleTime: Infinity,
		gcTime: 24 * 60 * 60 * 1000,
	})

	return queries
}
