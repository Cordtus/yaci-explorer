import { useMemo } from 'react'
import { useConfig } from '@/contexts/ConfigContext'
import { createApiClient, type YaciClient } from '@/lib/api'

/**
 * Hook to get a configured API client
 * Uses the postgrestUrl from the app config
 */
export function useApi(): YaciClient {
  const config = useConfig()
  return useMemo(() => createApiClient(config.postgrestUrl), [config.postgrestUrl])
}

/**
 * Hook to get just the PostgREST base URL
 */
export function usePostgrestUrl(): string {
  const config = useConfig()
  return config.postgrestUrl
}

/**
 * Hook to get the chain REST endpoint
 */
export function useChainRestEndpoint(): string {
  const config = useConfig()
  return config.chainRestEndpoint
}
