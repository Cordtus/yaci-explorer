/**
 * Server-side environment configuration
 * This file reads from process.env and is only available on the server
 */

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

/**
 * Get environment configuration from process.env
 * All env vars are now prefixed with EXPLORER_ instead of VITE_
 */
export function getServerConfig() {
  return {
    postgrestUrl: process.env.POSTGREST_URL || process.env.VITE_POSTGREST_URL || '/api',
    chainRestEndpoint: process.env.CHAIN_REST_ENDPOINT || process.env.VITE_CHAIN_REST_ENDPOINT || '',

    queries: {
      staleTimeMs: toNumber(process.env.QUERY_STALE_MS || process.env.VITE_QUERY_STALE_MS, 10_000),
      gcTimeMs: toNumber(process.env.QUERY_GC_MS || process.env.VITE_QUERY_GC_MS, 300_000),
    },

    transactions: {
      pageSize: toNumber(process.env.TX_PAGE_SIZE || process.env.VITE_TX_PAGE_SIZE, 20),
    },

    search: {
      addressResultLimit: toNumber(process.env.SEARCH_ADDRESS_LIMIT || process.env.VITE_SEARCH_ADDRESS_LIMIT, 20),
      autoNavigateSingle: toBoolean(process.env.SEARCH_AUTO_NAVIGATE_SINGLE || process.env.VITE_SEARCH_AUTO_NAVIGATE_SINGLE, true),
    },

    analytics: {
      transactionVolumeHours: toNumber(process.env.ANALYTICS_VOLUME_HOURS || process.env.VITE_ANALYTICS_VOLUME_HOURS, 24),
      transactionVolumeRefetchMs: toNumber(process.env.ANALYTICS_VOLUME_REFRESH_MS || process.env.VITE_ANALYTICS_VOLUME_REFRESH_MS, 60_000),
      messageSampleLimit: toNumber(process.env.ANALYTICS_MESSAGE_SAMPLE_LIMIT || process.env.VITE_ANALYTICS_MESSAGE_SAMPLE_LIMIT, 10_000),
      messageTopN: toNumber(process.env.ANALYTICS_MESSAGE_TOPN || process.env.VITE_ANALYTICS_MESSAGE_TOPN, 10),
      messageRefetchMs: toNumber(process.env.ANALYTICS_MESSAGE_REFRESH_MS || process.env.VITE_ANALYTICS_MESSAGE_REFRESH_MS, 60_000),
      eventSampleLimit: toNumber(process.env.ANALYTICS_EVENT_SAMPLE_LIMIT || process.env.VITE_ANALYTICS_EVENT_SAMPLE_LIMIT, 10_000),
      eventTopN: toNumber(process.env.ANALYTICS_EVENT_TOPN || process.env.VITE_ANALYTICS_EVENT_TOPN, 10),
      eventRefetchMs: toNumber(process.env.ANALYTICS_EVENT_REFRESH_MS || process.env.VITE_ANALYTICS_EVENT_REFRESH_MS, 60_000),
      blockIntervalLookback: toNumber(process.env.ANALYTICS_BLOCK_INTERVAL_LOOKBACK || process.env.VITE_ANALYTICS_BLOCK_INTERVAL_LOOKBACK, 100),
      blockIntervalRefetchMs: toNumber(process.env.ANALYTICS_BLOCK_INTERVAL_REFRESH_MS || process.env.VITE_ANALYTICS_BLOCK_INTERVAL_REFRESH_MS, 30_000),
      blockIntervalMaxSeconds: toNumber(process.env.ANALYTICS_BLOCK_INTERVAL_MAX_SECONDS || process.env.VITE_ANALYTICS_BLOCK_INTERVAL_MAX_SECONDS, 100),
      networkBlocksWindow: toNumber(process.env.ANALYTICS_NETWORK_BLOCK_WINDOW || process.env.VITE_ANALYTICS_NETWORK_BLOCK_WINDOW, 100),
      networkTxWindow: toNumber(process.env.ANALYTICS_NETWORK_TX_WINDOW || process.env.VITE_ANALYTICS_NETWORK_TX_WINDOW, 1000),
      networkMessageWindow: toNumber(process.env.ANALYTICS_NETWORK_MSG_WINDOW || process.env.VITE_ANALYTICS_NETWORK_MSG_WINDOW, 2000),
      networkRefetchMs: toNumber(process.env.ANALYTICS_NETWORK_REFRESH_MS || process.env.VITE_ANALYTICS_NETWORK_REFRESH_MS, 10_000),
    },

    resetNotice: {
      enabled: toBoolean(process.env.RESET_NOTICE_ENABLED || process.env.VITE_RESET_NOTICE_ENABLED, true),
      refetchIntervalMs: toNumber(process.env.RESET_NOTICE_REFETCH_MS || process.env.VITE_RESET_NOTICE_REFETCH_MS, 30_000),
      hashCheckHeight: toNumber(process.env.RESET_NOTICE_HASH_CHECK_HEIGHT || process.env.VITE_RESET_NOTICE_HASH_CHECK_HEIGHT, 5),
    },

    branding: {
      appName: process.env.APP_NAME || process.env.VITE_APP_NAME || 'Yaci Explorer',
      appNameShort: process.env.APP_NAME_SHORT || process.env.VITE_APP_NAME_SHORT || 'Explorer',
      logoUrl: process.env.LOGO_URL || process.env.VITE_LOGO_URL,
      faviconUrl: process.env.FAVICON_URL || process.env.VITE_FAVICON_URL,
      primaryColor: process.env.PRIMARY_COLOR || process.env.VITE_PRIMARY_COLOR,
      accentColor: process.env.ACCENT_COLOR || process.env.VITE_ACCENT_COLOR,
      footerText: process.env.FOOTER_TEXT || process.env.VITE_FOOTER_TEXT,
      links: {
        website: process.env.LINK_WEBSITE || process.env.VITE_LINK_WEBSITE,
        docs: process.env.LINK_DOCS || process.env.VITE_LINK_DOCS,
        github: process.env.LINK_GITHUB || process.env.VITE_LINK_GITHUB,
        discord: process.env.LINK_DISCORD || process.env.VITE_LINK_DISCORD,
        twitter: process.env.LINK_TWITTER || process.env.VITE_LINK_TWITTER,
      },
    },
  }
}

export type ServerConfig = ReturnType<typeof getServerConfig>
