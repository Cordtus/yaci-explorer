/**
 * API Client Singleton
 * Single instance for the entire application
 */

import { createClient } from '../../yaci-explorer-apis/packages/client'

const baseUrl = import.meta.env.VITE_POSTGREST_URL || 'http://localhost:3000'

/**
 * Singleton API client instance
 * Use this throughout the app - do NOT create new instances
 */
export const api = createClient(baseUrl)

export type { YaciClient } from '../../yaci-explorer-apis/packages/client'
export * from '../../yaci-explorer-apis/packages/client/src/types'
