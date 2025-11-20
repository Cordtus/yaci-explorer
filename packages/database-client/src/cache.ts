type CacheEntry<T> = {
  data: T
  ts: number
}

/**
 * Simple TTL cache for client-side fetch helpers.
 * Avoids refetching the same resource within the TTL window.
 */
export function createTTLCache(ttlMs: number) {
  const store = new Map<string, CacheEntry<unknown>>()

  function get<T>(key: string): T | null {
    const entry = store.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > ttlMs) {
      store.delete(key)
      return null
    }
    return entry.data as T
  }

  function set<T>(key: string, data: T) {
    store.set(key, { data, ts: Date.now() })
  }

  function clear(key?: string) {
    if (key) {
      store.delete(key)
      return
    }
    store.clear()
  }

  return { get, set, clear }
}
