const toNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

const env = import.meta.env

export const appConfig = {
  queries: {
    staleTimeMs: toNumber(env.VITE_QUERY_STALE_MS, 10_000),
    gcTimeMs: toNumber(env.VITE_QUERY_GC_MS, 300_000),
  },
  transactions: {
    pageSize: toNumber(env.VITE_TX_PAGE_SIZE, 20),
  },
  search: {
    addressResultLimit: toNumber(env.VITE_SEARCH_ADDRESS_LIMIT, 20),
    autoNavigateSingle: toBoolean(env.VITE_SEARCH_AUTO_NAVIGATE_SINGLE, true),
  },
  analytics: {
    transactionVolumeHours: toNumber(env.VITE_ANALYTICS_VOLUME_HOURS, 24),
    transactionVolumeRefetchMs: toNumber(env.VITE_ANALYTICS_VOLUME_REFRESH_MS, 60_000),
    messageSampleLimit: toNumber(env.VITE_ANALYTICS_MESSAGE_SAMPLE_LIMIT, 10_000),
    messageTopN: toNumber(env.VITE_ANALYTICS_MESSAGE_TOPN, 10),
    messageRefetchMs: toNumber(env.VITE_ANALYTICS_MESSAGE_REFRESH_MS, 60_000),
    eventSampleLimit: toNumber(env.VITE_ANALYTICS_EVENT_SAMPLE_LIMIT, 10_000),
    eventTopN: toNumber(env.VITE_ANALYTICS_EVENT_TOPN, 10),
    eventRefetchMs: toNumber(env.VITE_ANALYTICS_EVENT_REFRESH_MS, 60_000),
    blockIntervalLookback: toNumber(env.VITE_ANALYTICS_BLOCK_INTERVAL_LOOKBACK, 100),
    blockIntervalRefetchMs: toNumber(env.VITE_ANALYTICS_BLOCK_INTERVAL_REFRESH_MS, 30_000),
    blockIntervalMaxSeconds: toNumber(env.VITE_ANALYTICS_BLOCK_INTERVAL_MAX_SECONDS, 100),
    networkBlocksWindow: toNumber(env.VITE_ANALYTICS_NETWORK_BLOCK_WINDOW, 100),
    networkTxWindow: toNumber(env.VITE_ANALYTICS_NETWORK_TX_WINDOW, 1000),
    networkMessageWindow: toNumber(env.VITE_ANALYTICS_NETWORK_MSG_WINDOW, 2000),
    networkRefetchMs: toNumber(env.VITE_ANALYTICS_NETWORK_REFRESH_MS, 10_000),
  },
  resetNotice: {
    enabled: toBoolean(env.VITE_RESET_NOTICE_ENABLED, true),
    refetchIntervalMs: toNumber(env.VITE_RESET_NOTICE_REFETCH_MS, 30_000),
    hashCheckHeight: toNumber(env.VITE_RESET_NOTICE_HASH_CHECK_HEIGHT, 5),
  },
} as const

export type AppConfig = typeof appConfig
