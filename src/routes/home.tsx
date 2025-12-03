import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { appConfig } from '@/config/app'
import { formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetrics } from '@/components/common/DashboardMetrics'
import { css } from '@/styled-system/css'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: blocks, isLoading: blocksLoading, error: blocksError } = useQuery({
    queryKey: ['latestBlocks'],
    queryFn: async () => {
      const result = await api.getBlocks(appConfig.dashboard.itemCount, 0)
      return result
    },
    refetchInterval: appConfig.dashboard.refetchIntervalMs,
    staleTime: appConfig.dashboard.refetchIntervalMs / 2,
    enabled: mounted,
  })

  const { data: transactions, isLoading: txLoading, error: txError } = useQuery({
    queryKey: ['latestTransactions'],
    queryFn: async () => {
      const result = await api.getTransactions(appConfig.dashboard.itemCount, 0)
      return result
    },
    refetchInterval: appConfig.dashboard.refetchIntervalMs,
    staleTime: appConfig.dashboard.refetchIntervalMs / 2,
    enabled: mounted,
  })

  // Display errors if any
  if (mounted && (blocksError || txError)) {
    return (
      <div className={css(styles.errorContainer)}>
        <h2 className={css(styles.errorTitle)}>Error Loading Data</h2>
        {blocksError && <p className={css(styles.errorText)}>Blocks error: {String(blocksError)}</p>}
        {txError && <p className={css(styles.errorText)}>Transactions error: {String(txError)}</p>}
        <p className={css(styles.errorApiUrl)}>API URL: {api.getBaseUrl()}</p>
      </div>
    )
  }

  return (
    <div className={css(styles.container)}>
      <DashboardMetrics />

      <div className={css({
        display: 'grid',
        gap: '8',
        gridTemplateColumns: { base: '1fr', lg: 'repeat(2, 1fr)' }
      })}>
        <Card>
          <CardHeader className={css(styles.cardHeader)}>
            <CardTitle>Recent Blocks</CardTitle>
            <Link
              to="/blocks"
              className={css(styles.viewAllLink)}
            >
              View all <ArrowRight className={css(styles.arrowIcon)} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className={css(styles.listContainer)}>
              {blocksLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={css(styles.skeleton)} />
                ))
              ) : (
                blocks?.data.map((block) => (
                  <div
                    key={block.id}
                    className={css(styles.listItem)}
                  >
                    <div className={css(styles.itemLeft)}>
                      <div>
                        <Link
                          to={`/blocks/${block.id}`}
                          className={css(styles.itemLink)}
                        >
                          Block #{block.id}
                        </Link>
                        <div className={css(styles.itemSubtext)}>
                          {block.data?.block?.header?.time ? formatTimeAgo(block.data.block.header.time) : '-'}
                        </div>
                      </div>
                    </div>
                    <div className={css(styles.itemRight)}>
                      <div className={css(styles.itemStat)}>
                        {block.data?.txs?.length || 0} txs
                      </div>
                      <div className={css(styles.itemHash)}>
                        {formatHash(block.data?.block_id?.hash || block.data?.blockId?.hash || '', 6)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={css(styles.cardHeader)}>
            <CardTitle>Recent Transactions</CardTitle>
            <Link
              to="/tx"
              className={css(styles.viewAllLink)}
            >
              View all <ArrowRight className={css(styles.arrowIcon)} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className={css(styles.listContainer)}>
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={css(styles.skeleton)} />
                ))
              ) : (
                transactions?.data.map((tx) => {
                  const status = getTransactionStatus(tx.error)
                  return (
                    <div
                      key={tx.id}
                      className={css(styles.listItem)}
                    >
                      <div className={css(styles.itemLeft)}>
                        <div>
                          <Link
                            to={`/tx/${tx.id}`}
                            className={css(styles.itemLink)}
                          >
                            {formatHash(tx.id, 8)}
                          </Link>
                          <div className={css(styles.itemSubtext)}>
                            {tx.timestamp ? formatTimeAgo(tx.timestamp) : 'Unavailable'}
                          </div>
                        </div>
                      </div>
                      <div className={css(styles.itemRight)}>
                        <Badge
                          variant={tx.error ? 'destructive' : 'success'}
                          className={css(styles.badge)}
                        >
                          {status.label}
                        </Badge>
                        <div className={css(styles.itemHash)}>
                          {tx.height ? `Block #${tx.height}` : 'Block unknown'}
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
  },
  errorTitle: {
    fontSize: '2xl',
    fontWeight: 'bold',
    color: 'red.600',
  },
  errorText: {
    color: 'red.500',
  },
  errorApiUrl: {
    fontSize: 'sm',
    color: 'fg.muted',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllLink: {
    fontSize: 'sm',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    _hover: {
      color: '#30FF6E',
    },
  },
  arrowIcon: {
    height: '4',
    width: '4',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
  },
  skeleton: {
    height: '16',
    width: 'full',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingY: '3',
    borderBottomWidth: '1px',
    borderColor: 'rgba(94, 94, 94, 0.25)',
    transition: 'all 0.2s',
    _hover: {
      borderLeftWidth: '2px',
      borderLeftColor: '#30FF6E',
      paddingLeft: '2',
      backgroundColor: 'rgba(48, 255, 110, 0.05)',
    },
    _last: {
      borderBottomWidth: '0',
    },
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
  },
  itemLink: {
    fontWeight: 'medium',
    color: '#FFFFFF',
    _hover: {
      color: '#30FF6E',
    },
  },
  itemSubtext: {
    fontSize: 'sm',
    color: 'rgba(221, 244, 255, 0.75)',
  },
  itemRight: {
    textAlign: 'right',
  },
  itemStat: {
    fontSize: 'sm',
    color: '#30FF6E',
    fontWeight: 'medium',
  },
  itemHash: {
    fontSize: 'xs',
    color: 'rgba(221, 244, 255, 0.75)',
    fontFamily: 'mono',
  },
  badge: {
    marginBottom: '1',
  },
}
