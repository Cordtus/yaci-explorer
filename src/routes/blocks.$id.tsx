import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, Activity, Blocks as BlocksIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber, formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { css } from '../../styled-system/css'

const api = new YaciAPIClient()

export default function BlockDetailPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const params = useParams()
  const blockHeight = parseInt(params.id!)

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
      <div className={styles.stack4}>
        <Link to="/blocks" className={styles.backLink}>
          <ArrowLeft className={styles.iconSm} />
          Back to Blocks
        </Link>
        <Card>
          <CardContent className={styles.cardPadTop}>
            <div className={styles.centeredEmpty}>
              <BlocksIcon className={styles.emptyIcon} />
              <h2 className={styles.errorTitle}>Block Not Found</h2>
              <p className={styles.mutedText}>
                The requested block could not be found.
              </p>
              <p className={styles.errorText}>{String(blockError)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted || blockLoading) {
    return (
      <div className={styles.stack4}>
        <Skeleton className={css({ h: '8', w: '48' })} />
        <Skeleton className={css({ h: '64', w: 'full' })} />
        <Skeleton className={css({ h: '96', w: 'full' })} />
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

  return (
    <div className={styles.page}>
      {/* Header */}
      <div>
        <Link to="/blocks" className={styles.backLink}>
          <ArrowLeft className={styles.iconSm} />
          Back to Blocks
        </Link>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Block #{formatNumber(block.id)}</h1>
          <Badge variant="outline" className={styles.badgeInline}>
            <BlocksIcon className={styles.iconXs} />
            {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
          </Badge>
        </div>
        {timestamp && (
          <p className={styles.metaText}>
            {formatTimeAgo(timestamp)} • {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.mainCol}>
          {/* Block Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Block Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.stack4}>
                <div>
                  <label className={styles.label}>Block Hash</label>
                  <div className={styles.rowGap2}>
                    <p className={styles.codeSm}>{blockHash || 'N/A'}</p>
                    {blockHash && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={styles.iconButton}
                        onClick={() => copyToClipboard(blockHash)}
                      >
                        {copied ? <CheckCircle className={styles.iconXs} /> : <Copy className={styles.iconXs} />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className={styles.infoGrid}>
                  <div>
                    <label className={styles.label}>Height</label>
                    <p className={styles.valueLg}>{formatNumber(block.id)}</p>
                  </div>
                  <div>
                    <label className={styles.label}>Chain ID</label>
                    <p className={styles.textSm}>{chainId}</p>
                  </div>
                  <div>
                    <label className={styles.label}>Transactions</label>
                    <p className={styles.valueLg}>{txCount}</p>
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
                  <p className={styles.codeSm}>{proposerAddress}</p>
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
              {txLoading ? (
                <div className={styles.stack3}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className={css({ h: '16', w: 'full' })} />
                  ))}
                </div>
              ) : transactions && transactions.data.length > 0 ? (
                <div className={styles.stack3}>
                  {transactions.data.map((tx) => {
                    const status = getTransactionStatus(tx.error)
                    return (
                      <div
                        key={tx.id}
                        className={styles.txRow}
                      >
                        <div className={styles.txRowLeft}>
                          <div className={styles.avatar}>
                            <Activity className={styles.iconSm} />
                          </div>
                          <div>
                            <Link
                              to={`/transactions/${tx.id}`}
                              className={styles.txLink}
                            >
                              {formatHash(tx.id, 12)}
                            </Link>
                            <div className={styles.metaText}>
                              {formatTimeAgo(tx.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className={styles.txRight}>
                          <Badge
                            variant={tx.error ? 'destructive' : 'success'}
                            className={css({ mb: '1' })}
                          >
                            {status.label}
                          </Badge>
                          {tx.fee?.amount && tx.fee.amount.length > 0 && (
                            <div className={styles.metaText}>
                              {formatNumber(tx.fee.amount[0].amount)} {tx.fee.amount[0].denom}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className={styles.emptyState}>
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
              <div className={styles.stack3}>
                <div className={styles.summaryRow}>
                  <span className={styles.mutedText}>Height</span>
                  <span className={styles.summaryValue}>{formatNumber(block.id)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.mutedText}>Transactions</span>
                  <span className={styles.summaryValue}>{txCount}</span>
                </div>
                {timestamp && (
                  <div className={styles.summaryRow}>
                    <span className={styles.mutedText}>Age</span>
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
              <div className={styles.stack2}>
                <Link to={`/blocks/${block.id - 1}`}>
                  <Button variant="outline" className={styles.navButton} disabled={block.id <= 1}>
                    <ArrowLeft className={styles.iconSm} />
                    Previous Block
                  </Button>
                </Link>
                <Link to={`/blocks/${block.id + 1}`}>
                  <Button variant="outline" className={styles.navButton}>
                    Next Block
                    <ArrowLeft className={styles.iconSmFlip} />
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
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
  }),
  stack4: css({ display: 'flex', flexDirection: 'column', gap: '4' }),
  stack3: css({ display: 'flex', flexDirection: 'column', gap: '3' }),
  stack2: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  backLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    color: 'fg.muted',
    _hover: { color: 'fg.default' },
    mb: '4',
  }),
  headerRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    mb: '2',
  }),
  title: css({ fontSize: '3xl', fontWeight: 'bold', lineHeight: 'short' }),
  metaText: css({ fontSize: 'sm', color: 'fg.muted' }),
  badgeInline: css({ display: 'inline-flex', alignItems: 'center', gap: '1.5' }),
  iconXs: css({ h: '3.5', w: '3.5' }),
  iconSm: css({ h: '4', w: '4' }),
  iconSmFlip: css({ h: '4', w: '4', transform: 'rotate(180deg)' }),
  cardPadTop: css({ pt: '6' }),
  centeredEmpty: css({
    textAlign: 'center',
    py: '12',
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    alignItems: 'center',
  }),
  emptyIcon: css({ h: '12', w: '12', color: 'red.9' }),
  errorTitle: css({ fontSize: '2xl', fontWeight: 'bold', color: 'red.8' }),
  errorText: css({ fontSize: 'sm', color: 'red.8' }),
  label: css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' }),
  codeSm: css({ fontSize: 'sm', fontFamily: 'mono', wordBreak: 'break-all' }),
  textSm: css({ fontSize: 'sm' }),
  valueLg: css({ fontSize: 'lg', fontWeight: 'bold' }),
  rowGap2: css({ display: 'flex', alignItems: 'center', gap: '2', mt: '1' }),
  infoGrid: css({
    display: 'grid',
    gap: '4',
    gridTemplateColumns: { base: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
  }),
  iconButton: css({ h: '5', w: '5', p: '0' }),
  layoutGrid: css({
    display: 'grid',
    gap: '6',
    gridTemplateColumns: { base: '1fr', lg: '2fr 1fr' },
  }),
  mainCol: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
  }),
  sidebar: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
  }),
  summaryRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  summaryValue: css({ fontWeight: 'medium' }),
  mutedText: css({ color: 'fg.muted' }),
  txRow: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    py: '3',
    borderBottomWidth: '1px',
    borderColor: 'border.subtle',
    _last: { borderBottomWidth: '0' },
  }),
  txRowLeft: css({
    display: 'flex',
    alignItems: 'center',
    gap: '4',
  }),
  avatar: css({
    h: '10',
    w: '10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'colorPalette.a3',
    color: 'colorPalette.default',
  }),
  txLink: css({
    fontWeight: 'medium',
    color: 'fg.default',
    fontFamily: 'mono',
    fontSize: 'sm',
    _hover: { color: 'colorPalette.default' },
  }),
  txRight: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1',
  }),
  emptyState: css({
    fontSize: 'sm',
    color: 'fg.muted',
    textAlign: 'center',
    py: '8',
  }),
  navButton: css({
    w: 'full',
    justifyContent: 'flex-start',
    gap: '2',
  }),
}
