import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { api, type BlockRaw } from '@/lib/api'
import { clearChainInfoCache } from '@/lib/chain-info'
import { IBC_CACHE_KEY, CHANNEL_CACHE_KEY } from '@/lib/ibc-resolver'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'

type ChainFingerprint = {
  chainId: string
  height: number
  hash: string
}

const FINGERPRINT_KEY = 'yaci_chain_fingerprint'

function getFingerprint(block: BlockRaw): ChainFingerprint {
  const header = block.data?.block?.header
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <AlertTriangle className={styles.icon} />
          <div className={styles.textContent}>
            <p className={styles.title}>Chain reset detected</p>
            <p className={styles.description}>
              The chain appears to have restarted from genesis (or changed chain ID). Reset the indexer database and clear cached chain info to resume syncing.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className={styles.dismissButton}
          aria-label="Dismiss reset notice"
        >
          <X className={styles.dismissIcon} />
        </button>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={clearLocalCaches}
          className={styles.resetButton}
        >
          <RefreshCw className={styles.resetIcon} />
          Reset cache
        </button>
        <span className={styles.helperText}>
          After resetting data, restart the indexer (see deployment guide: "Resetting after a devnet/genesis restart").
        </span>
      </div>
    </div>
  )
}

const styles = {
  container: css({
    marginTop: '2',
    borderRadius: 'lg',
    border: '1px solid',
    borderColor: 'amber.300',
    bg: 'amber.50',
    px: '4',
    py: '3',
    color: 'amber.900',
    display: 'flex',
    flexDirection: 'column',
    gap: '2'
  }),
  header: css({
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'space-between',
    gap: '3'
  }),
  headerContent: css({
    display: 'flex',
    alignItems: 'start',
    gap: '3'
  }),
  icon: css({
    height: '5',
    width: '5',
    color: 'amber.600',
    marginTop: '0.5'
  }),
  textContent: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1'
  }),
  title: css({
    fontSize: 'sm',
    fontWeight: 'semibold'
  }),
  description: css({
    fontSize: 'sm'
  }),
  dismissButton: css({
    color: 'amber.700',
    _hover: {
      color: 'amber.900'
    }
  }),
  dismissIcon: css({
    height: '4',
    width: '4'
  }),
  actions: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2'
  }),
  resetButton: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    borderRadius: 'md',
    border: '1px solid',
    borderColor: 'amber.300',
    bg: 'white',
    px: '3',
    py: '1.5',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'amber.900',
    transition: 'colors',
    _hover: {
      bg: 'amber.100'
    }
  }),
  resetIcon: css({
    height: '4',
    width: '4'
  }),
  helperText: css({
    fontSize: 'xs',
    color: 'amber.800'
  })
}
