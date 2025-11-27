declare module "*.css" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly PUBLIC_POSTGREST_URL?: string;
  readonly PUBLIC_CHAIN_REST_ENDPOINT?: string;
  readonly VITE_POSTGREST_URL?: string;
  readonly VITE_CHAIN_REST_ENDPOINT?: string;
  readonly VITE_QUERY_STALE_MS?: string;
  readonly VITE_QUERY_GC_MS?: string;
  readonly VITE_TX_PAGE_SIZE?: string;
  readonly VITE_SEARCH_ADDRESS_LIMIT?: string;
  readonly VITE_SEARCH_AUTO_NAVIGATE_SINGLE?: string;
  readonly VITE_ANALYTICS_VOLUME_HOURS?: string;
  readonly VITE_ANALYTICS_VOLUME_REFRESH_MS?: string;
  readonly VITE_ANALYTICS_MESSAGE_SAMPLE_LIMIT?: string;
  readonly VITE_ANALYTICS_MESSAGE_TOPN?: string;
  readonly VITE_ANALYTICS_MESSAGE_REFRESH_MS?: string;
  readonly VITE_ANALYTICS_EVENT_SAMPLE_LIMIT?: string;
  readonly VITE_ANALYTICS_EVENT_TOPN?: string;
  readonly VITE_ANALYTICS_EVENT_REFRESH_MS?: string;
  readonly VITE_ANALYTICS_BLOCK_INTERVAL_LOOKBACK?: string;
  readonly VITE_ANALYTICS_BLOCK_INTERVAL_REFRESH_MS?: string;
  readonly VITE_ANALYTICS_BLOCK_INTERVAL_MAX_SECONDS?: string;
  readonly VITE_ANALYTICS_NETWORK_BLOCK_WINDOW?: string;
  readonly VITE_ANALYTICS_NETWORK_TX_WINDOW?: string;
  readonly VITE_ANALYTICS_NETWORK_MSG_WINDOW?: string;
  readonly VITE_ANALYTICS_NETWORK_REFRESH_MS?: string;
  readonly VITE_RESET_NOTICE_ENABLED?: string;
  readonly VITE_RESET_NOTICE_REFETCH_MS?: string;
  readonly VITE_RESET_NOTICE_HASH_CHECK_HEIGHT?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_NAME_SHORT?: string;
  readonly VITE_LOGO_URL?: string;
  readonly VITE_FAVICON_URL?: string;
  readonly VITE_PRIMARY_COLOR?: string;
  readonly VITE_ACCENT_COLOR?: string;
  readonly VITE_FOOTER_TEXT?: string;
  readonly VITE_LINK_WEBSITE?: string;
  readonly VITE_LINK_DOCS?: string;
  readonly VITE_LINK_GITHUB?: string;
  readonly VITE_LINK_DISCORD?: string;
  readonly VITE_LINK_TWITTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
