import { getConfig } from '@/lib/env'

// Lazy app config - evaluated on first access after loadConfig() has run
let _appConfig: AppConfigType | null = null

function buildAppConfig(): AppConfigType {
  const config = getConfig()

  return {
    queries: {
      staleTimeMs: config.queryStaleMs ?? 10_000,
      gcTimeMs: config.queryGcMs ?? 300_000,
    },
    dashboard: {
      refetchIntervalMs: config.dashboardRefreshMs ?? 6_000,
      itemCount: config.dashboardItemCount ?? 5,
    },
    transactions: {
      pageSize: config.txPageSize ?? 10,
    },
    blocks: {
      pageSize: config.blocksPageSize ?? 10,
    },
    search: {
      addressResultLimit: config.searchAddressLimit ?? 20,
      autoNavigateSingle: config.searchAutoNavigateSingle ?? true,
    },
    analytics: {
      transactionVolumeHours: config.analyticsVolumeHours ?? 24,
      transactionVolumeRefetchMs: config.analyticsVolumeRefreshMs ?? 60_000,
      messageSampleLimit: config.analyticsMessageSampleLimit ?? 10_000,
      messageTopN: config.analyticsMessageTopN ?? 10,
      messageRefetchMs: config.analyticsMessageRefreshMs ?? 60_000,
      eventSampleLimit: config.analyticsEventSampleLimit ?? 10_000,
      eventTopN: config.analyticsEventTopN ?? 10,
      eventRefetchMs: config.analyticsEventRefreshMs ?? 60_000,
      blockIntervalLookback: config.analyticsBlockIntervalLookback ?? 100,
      blockIntervalRefetchMs: config.analyticsBlockIntervalRefreshMs ?? 30_000,
      blockIntervalMaxSeconds: config.analyticsBlockIntervalMaxSeconds ?? 100,
      networkBlocksWindow: config.analyticsNetworkBlockWindow ?? 100,
      networkTxWindow: config.analyticsNetworkTxWindow ?? 1000,
      networkMessageWindow: config.analyticsNetworkMsgWindow ?? 2000,
      networkRefetchMs: config.analyticsNetworkRefreshMs ?? 10_000,
    },
  }
}

// Type definition for the config structure
interface AppConfigType {
  queries: {
    staleTimeMs: number
    gcTimeMs: number
  }
  dashboard: {
    refetchIntervalMs: number
    itemCount: number
  }
  transactions: {
    pageSize: number
  }
  blocks: {
    pageSize: number
  }
  search: {
    addressResultLimit: number
    autoNavigateSingle: boolean
  }
  analytics: {
    transactionVolumeHours: number
    transactionVolumeRefetchMs: number
    messageSampleLimit: number
    messageTopN: number
    messageRefetchMs: number
    eventSampleLimit: number
    eventTopN: number
    eventRefetchMs: number
    blockIntervalLookback: number
    blockIntervalRefetchMs: number
    blockIntervalMaxSeconds: number
    networkBlocksWindow: number
    networkTxWindow: number
    networkMessageWindow: number
    networkRefetchMs: number
  }
}

// Proxy for lazy initialization - defers config building until first property access
export const appConfig: AppConfigType = new Proxy({} as AppConfigType, {
  get(_, prop: keyof AppConfigType) {
    if (!_appConfig) {
      _appConfig = buildAppConfig()
    }
    return Reflect.get(_appConfig, prop)
  }
})

export type AppConfig = AppConfigType
