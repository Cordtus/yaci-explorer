import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Blocks, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatNumber, formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetrics } from '@/components/common/DashboardMetrics'
import { css, cx } from '@/styled-system/css'

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
      <div className={css(styles.errorContainer)}>
        <h2 className={css(styles.errorTitle)}>Error Loading Data</h2>
        {blocksError && <p className={css(styles.errorText)}>Blocks error: {String(blocksError)}</p>}
        {txError && <p className={css(styles.errorText)}>Transactions error: {String(txError)}</p>}
        <p className={css(styles.errorApiUrl)}>API URL: {api['baseUrl']}</p>
      </div>
    )
  }

  return (
    <div className={css(styles.container)}>
      <DashboardMetrics />

      <div className={css(styles.grid)}>
        <Card>
          <CardHeader className={css(styles.cardHeader)}>
            <CardTitle>Latest Blocks</CardTitle>
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
                      <div className={css(styles.iconCircle)}>
                        <Blocks className={css(styles.icon)} />
                      </div>
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
            <CardTitle>Latest Transactions</CardTitle>
            <Link
              to="/transactions"
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
                        <div className={css(styles.iconCircle)}>
                          <Activity className={css(styles.icon)} />
                        </div>
                        <div>
                          <Link
                            to={`/transactions/${tx.id}`}
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
  grid: {
    display: 'grid',
    gap: '8',
    gridTemplateColumns: { base: '1', lg: '2' },
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllLink: {
    fontSize: 'sm',
    color: 'fg.muted',
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    _hover: {
      color: 'fg.default',
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
    _last: {
      borderBottomWidth: '0',
    },
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
  },
  iconCircle: {
    height: '10',
    width: '10',
    borderRadius: 'full',
    backgroundColor: 'colorPalette.a10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    height: '5',
    width: '5',
    color: 'colorPalette',
  },
  itemLink: {
    fontWeight: 'medium',
    _hover: {
      color: 'colorPalette',
    },
  },
  itemSubtext: {
    fontSize: 'sm',
    color: 'fg.muted',
  },
  itemRight: {
    textAlign: 'right',
  },
  itemStat: {
    fontSize: 'sm',
  },
  itemHash: {
    fontSize: 'xs',
    color: 'fg.muted',
  },
  badge: {
    marginBottom: '1',
  },
}
