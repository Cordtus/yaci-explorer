import { getConfig } from '@/lib/env'

/**
 * Get application configuration
 * Values are loaded from runtime config.json with fallbacks to defaults
 */
export function getAppConfig() {
  const config = getConfig()

  return {
    queries: {
      staleTimeMs: config.queries?.staleTimeMs ?? 10_000,
      gcTimeMs: config.queries?.gcTimeMs ?? 300_000,
    },
    dashboard: {
      refetchIntervalMs: config.dashboard?.refetchIntervalMs ?? 6_000,
      itemCount: config.dashboard?.itemCount ?? 5,
    },
    transactions: {
      pageSize: config.transactions?.pageSize ?? 10,
    },
    blocks: {
      pageSize: config.blocks?.pageSize ?? 10,
    },
    search: {
      addressResultLimit: config.search?.addressResultLimit ?? 20,
      autoNavigateSingle: config.search?.autoNavigateSingle ?? true,
    },
    analytics: {
      transactionVolumeHours: config.analytics?.transactionVolumeHours ?? 24,
      transactionVolumeRefetchMs: config.analytics?.transactionVolumeRefetchMs ?? 60_000,
      messageSampleLimit: config.analytics?.messageSampleLimit ?? 10_000,
      messageTopN: config.analytics?.messageTopN ?? 10,
      messageRefetchMs: config.analytics?.messageRefetchMs ?? 60_000,
      eventSampleLimit: config.analytics?.eventSampleLimit ?? 10_000,
      eventTopN: config.analytics?.eventTopN ?? 10,
      eventRefetchMs: config.analytics?.eventRefetchMs ?? 60_000,
      blockIntervalLookback: config.analytics?.blockIntervalLookback ?? 100,
      blockIntervalRefetchMs: config.analytics?.blockIntervalRefetchMs ?? 30_000,
      blockIntervalMaxSeconds: config.analytics?.blockIntervalMaxSeconds ?? 100,
      networkBlocksWindow: config.analytics?.networkBlocksWindow ?? 100,
      networkTxWindow: config.analytics?.networkTxWindow ?? 1000,
      networkMessageWindow: config.analytics?.networkMessageWindow ?? 2000,
      networkRefetchMs: config.analytics?.networkRefetchMs ?? 10_000,
    },
    resetNotice: {
      enabled: config.resetNotice?.enabled ?? true,
      refetchIntervalMs: config.resetNotice?.refetchIntervalMs ?? 30_000,
      hashCheckHeight: config.resetNotice?.hashCheckHeight ?? 5,
    },
  } as const
}

export const appConfig = getAppConfig()

export type AppConfigType = ReturnType<typeof getAppConfig>
