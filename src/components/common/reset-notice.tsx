import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { api } from '@/lib/api'
import { clearChainInfoCache } from '@/lib/chain-info'
import { IBC_CACHE_KEY, CHANNEL_CACHE_KEY } from '@/lib/ibc-resolver'
import { appConfig } from '@/config/app'
import type { Block } from '@/types/blockchain'

type ChainFingerprint = {
  chainId: string
  height: number
  hash: string
}

const FINGERPRINT_KEY = 'yaci_chain_fingerprint'

function getFingerprint(block: Block): ChainFingerprint {
  const header = block.data?.block?.header as any
  const height = typeof block.id === 'number'
    ? block.id
    : parseInt(header?.height || '0', 10)
  const hash =
    block.data?.block_id?.hash ||
    (block as any).data?.blockId?.hash ||
    String(block.id || header?.height || '')
  const chainId = header?.chain_id || 'unknown'

  return {
    chainId,
    height: Number.isFinite(height) ? height : 0,
    hash: hash || 'unknown'
  }
}

function persistFingerprint(fp: ChainFingerprint | null) {
  if (typeof window === 'undefined' || !fp) return
  localStorage.setItem(FINGERPRINT_KEY, JSON.stringify(fp))
}

function loadFingerprint(): ChainFingerprint | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(FINGERPRINT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ChainFingerprint
  } catch {
    return null
  }
}

export function ResetNotice() {
  const queryClient = useQueryClient()
  const [resetDetected, setResetDetected] = useState(false)
  const [currentFingerprint, setCurrentFingerprint] = useState<ChainFingerprint | null>(null)

  const { data: latestBlock } = useQuery({
    queryKey: ['latest-block-reset-watch'],
    queryFn: () => api.getLatestBlock(),
    staleTime: appConfig.resetNotice.refetchIntervalMs,
    refetchInterval: appConfig.resetNotice.refetchIntervalMs,
    enabled: typeof window !== 'undefined' && appConfig.resetNotice.enabled
  })

  useEffect(() => {
    if (!latestBlock || typeof window === 'undefined' || !appConfig.resetNotice.enabled) return
    const current = getFingerprint(latestBlock)
    setCurrentFingerprint(current)

    const stored = loadFingerprint()
    if (!stored) {
      persistFingerprint(current)
      return
    }

    const chainChanged = stored.chainId !== current.chainId
    const heightRewound = current.height < stored.height
    const hashCheckHeight = appConfig.resetNotice.hashCheckHeight
    const hashChanged =
      stored.hash !== current.hash &&
      current.height <= hashCheckHeight &&
      stored.height <= hashCheckHeight

    if (chainChanged || heightRewound || hashChanged) {
      setResetDetected(true)
    } else {
      persistFingerprint(current)
      setResetDetected(false)
    }
  }, [latestBlock])

  if (!appConfig.resetNotice.enabled || !resetDetected) {
    return null
  }

  const clearLocalCaches = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(IBC_CACHE_KEY)
      localStorage.removeItem(CHANNEL_CACHE_KEY)
      localStorage.removeItem(FINGERPRINT_KEY)
      sessionStorage.clear()
    }
    clearChainInfoCache()
    queryClient.clear()
    persistFingerprint(currentFingerprint)
    setResetDetected(false)
  }

  const dismiss = () => {
    persistFingerprint(currentFingerprint)
    setResetDetected(false)
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Chain reset detected</p>
            <p className="text-sm">
              The chain appears to have restarted from genesis (or changed chain ID). Reset the indexer database and clear cached chain info to resume syncing.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-amber-700 hover:text-amber-900"
          aria-label="Dismiss reset notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={clearLocalCaches}
          className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reset cache
        </button>
        <span className="text-xs text-amber-800">
          After resetting data, restart the indexer (see deployment guide: “Resetting after a devnet/genesis restart”).
        </span>
      </div>
    </div>
  )
}
