declare module "*.css" {
	const content: string
	export default content
}

// Runtime config keys (loaded from /config.json)
interface RuntimeConfig {
	readonly apiUrl?: string
	readonly chainRestEndpoint?: string
	readonly evmRpcEndpoint?: string
	readonly appName?: string
	readonly appNameShort?: string
	readonly logoUrl?: string
	readonly faviconUrl?: string
	readonly primaryColor?: string
	readonly accentColor?: string
	readonly footerText?: string
	readonly links?: {
		website?: string
		docs?: string
		github?: string
		discord?: string
		twitter?: string
	}
	// Query tuning
	readonly queryStaleMs?: number
	readonly queryGcMs?: number
	readonly txPageSize?: number
	readonly blocksPageSize?: number
	readonly dashboardRefreshMs?: number
	readonly dashboardItemCount?: number
	// Search
	readonly searchAddressLimit?: number
	readonly searchAutoNavigateSingle?: boolean
	// Analytics
	readonly analyticsVolumeHours?: number
	readonly analyticsVolumeRefreshMs?: number
	readonly analyticsMessageSampleLimit?: number
	readonly analyticsMessageTopN?: number
	readonly analyticsMessageRefreshMs?: number
	readonly analyticsEventSampleLimit?: number
	readonly analyticsEventTopN?: number
	readonly analyticsEventRefreshMs?: number
	readonly analyticsBlockIntervalLookback?: number
	readonly analyticsBlockIntervalRefreshMs?: number
	readonly analyticsBlockIntervalMaxSeconds?: number
	readonly analyticsNetworkBlockWindow?: number
	readonly analyticsNetworkTxWindow?: number
	readonly analyticsNetworkMsgWindow?: number
	readonly analyticsNetworkRefreshMs?: number
}
