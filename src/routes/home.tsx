import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Blocks, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber, formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetrics } from '@/components/common/DashboardMetrics'
import { css } from '../../styled-system/css'

const api = new YaciAPIClient()

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: blocks, isLoading: blocksLoading, error: blocksError } = useQuery({
    queryKey: ['latestBlocks'],
    queryFn: async () => {
      const result = await api.getBlocks(5, 0)
      return result
    },
    refetchInterval: 2000,
    enabled: mounted,
  })

  const { data: transactions, isLoading: txLoading, error: txError } = useQuery({
    queryKey: ['latestTransactions'],
    queryFn: async () => {
      const result = await api.getTransactions(5, 0)
      return result
    },
    refetchInterval: 2000,
    enabled: mounted,
  })

  // Display errors if any
  if (mounted && (blocksError || txError)) {
    return (
      <div className={styles.errorStack}>
        <h2 className={styles.errorTitle}>Error Loading Data</h2>
        {blocksError && <p className={styles.errorText}>Blocks error: {String(blocksError)}</p>}
        {txError && <p className={styles.errorText}>Transactions error: {String(txError)}</p>}
        <p className={styles.errorMeta}>API URL: {api['baseUrl']}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Dashboard Metrics */}
      <DashboardMetrics />

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}
      >
        {/* Latest Blocks */}
        <Card>
          <CardHeader className={styles.listHeader}>
            <CardTitle className={styles.sectionTitle}>Latest Blocks</CardTitle>
            <Link
              to="/blocks"
              className={styles.subtleLink}
            >
              View all <ArrowRight className={styles.arrowIcon} />
            </Link>
          </CardHeader>
          <CardContent className={styles.listContent}>
            <div className={styles.list}>
              {blocksLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={styles.listSkeleton} />
                ))
              ) : (
                blocks?.data.map((block) => (
                  <div
                    key={block.id}
                    className={styles.row}
                  >
                    <div className={styles.rowLeft}>
                      <div className={styles.iconCircle}>
                        <Blocks className={styles.rowIcon} />
                      </div>
                      <div>
                        <Link
                          to={`/blocks/${block.id}`}
                          className={styles.primaryLink}
                        >
                          Block #{block.id}
                        </Link>
                        <div className={styles.metaText}>
                          {block.data?.block?.header?.time ? formatTimeAgo(block.data.block.header.time) : '-'}
                        </div>
                      </div>
                    </div>
                    <div className={styles.textRight}>
                      <div className={styles.metaEmphasis}>
                        {block.data?.txs?.length || 0} txs
                      </div>
                      <div className={styles.hashText}>
                        {formatHash(block.data?.block_id?.hash || block.data?.blockId?.hash || '', 6)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Transactions */}
        <Card>
          <CardHeader className={styles.listHeader}>
            <CardTitle className={styles.sectionTitle}>Latest Transactions</CardTitle>
            <Link
              to="/transactions"
              className={styles.subtleLink}
            >
              View all <ArrowRight className={styles.arrowIcon} />
            </Link>
          </CardHeader>
          <CardContent className={styles.listContent}>
            <div className={styles.list}>
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={styles.listSkeleton} />
                ))
              ) : (
                transactions?.data.map((tx) => {
                  const status = getTransactionStatus(tx.error)
                  return (
                    <div
                      key={tx.id}
                      className={styles.row}
                    >
                      <div className={styles.rowLeft}>
                        <div className={styles.iconCircle}>
                          <Activity className={styles.rowIcon} />
                        </div>
                        <div>
                          <Link
                            to={`/transactions/${tx.id}`}
                            className={styles.primaryLink}
                          >
                            {formatHash(tx.id, 8)}
                          </Link>
                          <div className={styles.metaText}>
                            {formatTimeAgo(tx.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className={styles.textRight}>
                        <Badge
                          variant={tx.error ? 'destructive' : 'success'}
                          className={styles.badge}
                        >
                          {status.label}
                        </Badge>
                        <div className={styles.hashText}>
                          Block #{tx.height}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const styles = {
  errorStack: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    p: '4',
    bg: 'red.3',
    borderWidth: '1px',
    borderColor: 'red.6',
    borderRadius: 'lg',
  }),
  errorTitle: css({
    fontSize: '2xl',
    fontWeight: 'bold',
    color: 'red.11',
  }),
  errorText: css({
    color: 'red.10',
  }),
  errorMeta: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '8',
    textAlign: 'left',
  }),
  grid: css({
    display: 'grid',
    gap: '8',
    alignItems: 'start',
  }),
  listHeader: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2',
    pb: '1',
    px: '2',
    textAlign: 'left',
  }),
  sectionTitle: css({
    fontSize: 'xl',
    fontWeight: 'semibold',
    letterSpacing: '-0.01em',
    textAlign: 'left',
  }),
  subtleLink: css({
    fontSize: 'sm',
    color: 'fg.muted',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    _hover: { color: 'fg.default' },
  }),
  arrowIcon: css({
    h: '4',
    w: '4',
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
  }),
  listContent: css({
    pt: '1',
    px: '2',
  }),
  listSkeleton: css({
    h: '16',
    w: 'full',
    borderRadius: 'lg',
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    py: '3.5',
    borderBottomWidth: '1px',
    borderColor: 'border.subtle',
    _last: { borderBottomWidth: '0' },
    textAlign: 'left',
  }),
  rowLeft: css({
    display: 'flex',
    alignItems: 'center',
    gap: '4',
  }),
  iconCircle: css({
    h: '10',
    w: '10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'full',
    bg: 'colorPalette.a3',
    color: 'colorPalette.default',
  }),
  rowIcon: css({
    h: '5',
    w: '5',
  }),
  primaryLink: css({
    fontWeight: 'medium',
    color: 'fg.default',
    fontSize: 'md',
    letterSpacing: '-0.01em',
    _hover: { color: 'colorPalette.default' },
  }),
  metaText: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  metaEmphasis: css({
    fontSize: 'sm',
    color: 'fg.default',
    fontWeight: 'medium',
  }),
  hashText: css({
    fontSize: 'xs',
    color: 'fg.subtle',
    fontFamily: 'mono',
  }),
  textRight: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1',
  }),
  badge: css({
    mb: '1',
  }),
}
