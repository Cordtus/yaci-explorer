import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, Activity, Blocks as BlocksIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatNumber, formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { css } from '@/styled-system/css'

export default function BlockDetailPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const params = useParams()
  const blockHeight = parseInt(params.id!, 10)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: block, isLoading: blockLoading, error: blockError } = useQuery({
    queryKey: ['block', blockHeight],
    queryFn: async () => {
      const result = await api.getBlock(blockHeight)
      return result
    },
    enabled: mounted && !isNaN(blockHeight),
  })

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['blockTransactions', blockHeight],
    queryFn: async () => {
      const result = await api.getTransactions(100, 0, { block_height: blockHeight })
      return result
    },
    enabled: mounted && !isNaN(blockHeight),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (mounted && blockError) {
    return (
      <div className={styles.errorContainer}>
        <Link to="/blocks" className={styles.backLink}>
          <ArrowLeft className={styles.icon} />
          Back to Blocks
        </Link>
        <Card>
          <CardContent className={styles.errorCardContent}>
            <div className={styles.errorContent}>
              <BlocksIcon className={styles.errorIcon} />
              <h2 className={styles.errorTitle}>Block Not Found</h2>
              <p className={styles.errorMessage}>
                The requested block could not be found.
              </p>
              <p className={styles.errorDetails}>{String(blockError)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted || blockLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Skeleton className={styles.skeletonHeader} />
        <Skeleton className={styles.skeletonMedium} />
        <Skeleton className={styles.skeletonLarge} />
      </div>
    )
  }

  if (!block) {
    return null
  }

  const blockHash = block.data?.block_id?.hash || block.data?.blockId?.hash || ''
  const chainId = block.data?.block?.header?.chain_id || 'N/A'
  const proposerAddress = block.data?.block?.header?.proposer_address || 'N/A'
  const timestamp = block.data?.block?.header?.time || null
  const txCount = block.data?.txs?.length || 0
  const ingestedTxCount = transactions?.data.length || 0
  const missingTxCount = Math.max(txCount - ingestedTxCount, 0)
  const hasMissingTxs = !txLoading && missingTxCount > 0

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div>
        <Link to="/blocks" className={styles.backLinkWithMargin}>
          <ArrowLeft className={styles.icon} />
          Back to Blocks
        </Link>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Block #{formatNumber(block.id)}</h1>
          <Badge variant="outline">
            <BlocksIcon className={styles.badgeIcon} />
            {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
          </Badge>
        </div>
        {timestamp && (
          <p className={styles.timestamp}>
            {formatTimeAgo(timestamp)} • {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.mainColumn}>
          {/* Block Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Block Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.overviewContent}>
                <div>
                  <label className={styles.label}>Block Hash</label>
                  <div className={styles.hashRow}>
                    <p className={styles.hashText}>{blockHash || 'N/A'}</p>
                    {blockHash && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={styles.copyButton}
                        onClick={() => copyToClipboard(blockHash)}
                      >
                        {copied ? <CheckCircle className={styles.copyIcon} /> : <Copy className={styles.copyIcon} />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className={styles.statsGrid}>
                  <div>
                    <label className={styles.label}>Height</label>
                    <p className={styles.statValue}>{formatNumber(block.id)}</p>
                  </div>
                  <div>
                    <label className={styles.label}>Chain ID</label>
                    <p className={styles.textSm}>{chainId}</p>
                  </div>
                  <div>
                    <label className={styles.label}>Transactions</label>
                    <p className={styles.statValue}>{txCount}</p>
                  </div>
                  {timestamp && (
                    <div>
                      <label className={styles.label}>Timestamp</label>
                      <p className={styles.textSm}>{formatTimeAgo(timestamp)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className={styles.label}>Proposer Address</label>
                  <p className={styles.proposerAddress}>{proposerAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions ({txCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {hasMissingTxs && (
                <div className={styles.warningBox}>
                  {missingTxCount === txCount ? (
                    <p>
                      This block references {txCount} transaction{txCount === 1 ? '' : 's'}, but none could be decoded
                      from the RPC node. The indexer stores the hashes with error metadata so ingestion can continue.
                    </p>
                  ) : (
                    <p>
                      Only {ingestedTxCount} of {txCount} transaction{txCount === 1 ? '' : 's'} exposed details.
                      The remaining {missingTxCount} could not be fetched from the gRPC node (pruned node, payload too
                      large, etc.).
                    </p>
                  )}
                  <p className={styles.warningSubtext}>
                    Ensure the node exposes full `GetTx` responses or re-sync from a non-pruned peer to see complete
                    data.
                  </p>
                </div>
              )}
              {txLoading ? (
                <div className={styles.skeletonList}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className={styles.skeletonItem} />
                  ))}
                </div>
              ) : transactions && transactions.data.length > 0 ? (
                <div className={styles.txList}>
                  {transactions.data.map((tx) => {
                    const status = getTransactionStatus(tx.error)
                    return (
                      <div
                        key={tx.id}
                        className={styles.txRow}
                      >
                        <div className={styles.txContent}>
                          <div className={styles.txIcon}>
                            <Activity className={styles.activityIcon} />
                          </div>
                          <div>
                            <Link
                              to={`/tx/${tx.id}`}
                              className={styles.txLink}
                            >
                              {formatHash(tx.id, 12)}
                            </Link>
                            <div className={styles.txTimestamp}>
                              {tx.timestamp ? formatTimeAgo(tx.timestamp) : 'Unavailable'}
                            </div>
                          </div>
                        </div>
                        <div className={styles.txRight}>
                          <Badge
                            variant={tx.error ? 'destructive' : 'success'}
                            className={styles.statusBadge}
                          >
                            {status.label}
                          </Badge>
                          {tx.fee?.amount && tx.fee.amount.length > 0 && (
                            <div className={styles.txFee}>
                              {formatNumber(tx.fee.amount[0].amount)} {tx.fee.amount[0].denom}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className={styles.emptyMessage}>
                  No transactions in this block
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.summaryContent}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Height</span>
                  <span className={styles.summaryValue}>{formatNumber(block.id)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Transactions</span>
                  <span className={styles.summaryValue}>{txCount}</span>
                </div>
                {timestamp && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Age</span>
                    <span className={styles.summaryValue}>{formatTimeAgo(timestamp)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.navButtons}>
                <Link to={`/blocks/${block.id - 1}`}>
                  <Button variant="outline" className={styles.navButton} disabled={block.id <= 1}>
                    <ArrowLeft className={styles.navIcon} />
                    Previous Block
                  </Button>
                </Link>
                <Link to={`/blocks/${block.id + 1}`}>
                  <Button variant="outline" className={styles.navButton}>
                    Next Block
                    <ArrowLeft className={styles.navIconRotated} />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const styles = {
  errorContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }),
  backLink: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'fg.muted',
    _hover: {
      color: 'fg.default',
    },
  }),
  icon: css({
    height: '1rem',
    width: '1rem',
  }),
  errorCardContent: css({
    paddingTop: '1.5rem',
  }),
  errorContent: css({
    textAlign: 'center',
    paddingY: '3rem',
  }),
  errorIcon: css({
    height: '3rem',
    width: '3rem',
    color: 'red.500',
    marginX: 'auto',
    marginBottom: '1rem',
  }),
  errorTitle: css({
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'red.600',
    marginBottom: '0.5rem',
  }),
  errorMessage: css({
    color: 'fg.muted',
    marginBottom: '1rem',
  }),
  errorDetails: css({
    fontSize: 'sm',
    color: 'red.500',
  }),
  loadingContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }),
  skeletonHeader: css({
    height: '2rem',
    width: '12rem',
  }),
  skeletonMedium: css({
    height: '16rem',
    width: '100%',
  }),
  skeletonLarge: css({
    height: '24rem',
    width: '100%',
  }),
  pageContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }),
  backLinkWithMargin: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'fg.muted',
    marginBottom: '1rem',
    _hover: {
      color: 'fg.default',
    },
  }),
  headerContent: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  }),
  pageTitle: css({
    fontSize: '1.875rem',
    fontWeight: 'bold',
  }),
  badgeIcon: css({
    height: '0.75rem',
    width: '0.75rem',
    marginRight: '0.25rem',
  }),
  timestamp: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  mainGrid: css({
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: { base: '1fr', lg: 'repeat(3, 1fr)' },
  }),
  mainColumn: css({
    gridColumn: { base: 'span 1', lg: 'span 2' },
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }),
  overviewContent: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }),
  label: css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'fg.muted',
  }),
  hashRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  }),
  hashText: css({
    fontSize: 'sm',
    fontFamily: 'mono',
    wordBreak: 'break-all',
  }),
  copyButton: css({
    height: '1.25rem',
    width: '1.25rem',
  }),
  copyIcon: css({
    height: '0.75rem',
    width: '0.75rem',
  }),
  statsGrid: css({
    display: 'grid',
    gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)' },
    gap: '1rem',
  }),
  statValue: css({
    fontSize: 'lg',
    fontWeight: 'bold',
  }),
  textSm: css({
    fontSize: 'sm',
  }),
  proposerAddress: css({
    fontSize: 'sm',
    fontFamily: 'mono',
    wordBreak: 'break-all',
    marginTop: '0.25rem',
  }),
  warningBox: css({
    marginBottom: '1rem',
    borderRadius: 'md',
    border: '1px solid',
    borderColor: 'amber.200',
    backgroundColor: 'amber.50',
    padding: '0.75rem',
    fontSize: 'sm',
    color: 'amber.900',
  }),
  warningSubtext: css({
    marginTop: '0.25rem',
    fontSize: 'xs',
  }),
  skeletonList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }),
  skeletonItem: css({
    height: '4rem',
    width: '100%',
  }),
  txList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }),
  txRow: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingY: '0.75rem',
    borderBottom: '1px solid',
    borderColor: 'border.default',
    _last: {
      borderBottom: '0',
    },
  }),
  txContent: css({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }),
  txIcon: css({
    height: '2.5rem',
    width: '2.5rem',
    borderRadius: 'full',
    backgroundColor: 'colorPalette.10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  activityIcon: css({
    height: '1.25rem',
    width: '1.25rem',
    color: 'colorPalette.default',
  }),
  txLink: css({
    fontWeight: 'medium',
    fontFamily: 'mono',
    fontSize: 'sm',
    _hover: {
      color: 'colorPalette.default',
    },
  }),
  txTimestamp: css({
    fontSize: 'xs',
    color: 'fg.muted',
  }),
  txRight: css({
    textAlign: 'right',
  }),
  statusBadge: css({
    marginBottom: '0.25rem',
  }),
  txFee: css({
    fontSize: 'xs',
    color: 'fg.muted',
  }),
  emptyMessage: css({
    fontSize: 'sm',
    color: 'fg.muted',
    textAlign: 'center',
    paddingY: '2rem',
  }),
  sidebar: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }),
  summaryContent: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }),
  summaryRow: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  summaryLabel: css({
    color: 'fg.muted',
  }),
  summaryValue: css({
    fontWeight: 'medium',
  }),
  navButtons: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }),
  navButton: css({
    width: '100%',
    justifyContent: 'flex-start',
  }),
  navIcon: css({
    height: '1rem',
    width: '1rem',
    marginRight: '0.5rem',
  }),
  navIconRotated: css({
    height: '1rem',
    width: '1rem',
    marginLeft: '0.5rem',
    rotate: '180deg',
  }),
}
