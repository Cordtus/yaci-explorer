import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, User, ArrowUpRight, ArrowDownLeft, Activity, FileCode, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api, type EnhancedTransaction } from '@/lib/api'
import { formatNumber, formatTimeAgo, formatHash, cn, getAddressType, getAlternateAddress } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { css, cx } from '@/styled-system/css'

/**
 * Address detail page component
 * Displays address statistics and transaction history for a blockchain address
 */
export default function AddressDetailPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [page, setPage] = useState(0)
  const params = useParams()
  const pageSize = 20

  // Track how user arrived - this determines UX emphasis
  const entryFormat = params.id ? getAddressType(params.id) : null
  const isEvmFocused = entryFormat === 'evm'

  const alternateAddr = params.id ? getAlternateAddress(params.id) : null

  // Compute both address formats for display
  const hexAddr = isEvmFocused ? params.id : alternateAddr
  const bech32Addr = isEvmFocused ? alternateAddr : params.id

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if address is a contract by querying evm_contracts table
  const { data: isContract } = useQuery({
    queryKey: ['is-contract', hexAddr],
    queryFn: async () => {
      if (!hexAddr) return false
      return await api.isEvmContract(hexAddr)
    },
    enabled: mounted && !!hexAddr,
    staleTime: Infinity, // Contract status doesn't change
  })

  // Fetch address statistics (always use bech32 format for API queries)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['address-stats', bech32Addr],
    queryFn: async () => {
      if (!bech32Addr) return null
      return await api.getAddressStats(bech32Addr)
    },
    enabled: mounted && !!bech32Addr,
  })

  // Fetch transactions for this address (always use bech32 format for API queries)
  const { data: transactions, isLoading: txLoading} = useQuery({
    queryKey: ['address-transactions', bech32Addr, page],
    queryFn: async () => {
      if (!bech32Addr) return { data: [], pagination: { total: 0, limit: pageSize, offset: 0, has_next: false, has_prev: false } }
      return await api.getTransactionsByAddress(bech32Addr, pageSize, page * pageSize)
    },
    enabled: mounted && !!bech32Addr,
  })

  /**
   * Copies text to clipboard and shows confirmation
   * @param text - Text to copy to clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /**
   * Determines if the address is the sender in a transaction
   * @param tx - Transaction to check
   * @returns True if the address is the sender
   */
  const isSender = (tx: EnhancedTransaction): boolean => {
    return tx.messages?.some(msg => msg.sender === params.id) ?? false
  }

  if (!mounted || statsLoading) {
    return (
      <div className={styles.pageContainer}>
        <Skeleton className={styles.skeletonHeader} />
        <Skeleton className={styles.skeletonCard} />
        <Skeleton className={styles.skeletonTable} />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={styles.pageContainer}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} />
          Back to Home
        </Link>
        <Card>
          <CardContent className={styles.cardPadding}>
            <div className={styles.notFoundContainer}>
              <User className={styles.notFoundIcon} />
              <h2 className={styles.notFoundTitle}>Address Not Found</h2>
              <p className={styles.notFoundText}>
                No transactions found for this address.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.pageContainerLarge}>
      {/* Header */}
      <div>
        <Link to="/" className={styles.backLinkWithMargin}>
          <ArrowLeft className={styles.backIcon} />
          Back to Home
        </Link>
        <div className={styles.headerContent}>
          {isContract ? (
            <FileCode className={styles.headerIcon} />
          ) : (
            <Wallet className={styles.headerIcon} />
          )}
          <h1 className={styles.headerTitle}>
            {isContract ? 'Contract' : 'Account'} Details
          </h1>
          <Badge variant="outline" className={css({ ml: '2' })}>
            {isContract === undefined ? (isEvmFocused ? 'EVM' : 'Cosmos') : isContract ? 'Contract' : 'EOA'}
          </Badge>
        </div>
        <div className={styles.addressContainer}>
          <div className={css({ flex: '1' })}>
            {/* Primary address - based on entry format */}
            <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
              <Badge variant={isEvmFocused ? 'default' : 'outline'} className={css({ fontSize: 'xs', minW: '3.5rem', justifyContent: 'center' })}>
                Hex
              </Badge>
              <p className={cx(styles.addressText, css({ fontWeight: isEvmFocused ? 'semibold' : 'normal' }))}>
                {hexAddr}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className={styles.copyButton}
                onClick={() => hexAddr && copyToClipboard(hexAddr)}
              >
                {copied ? <CheckCircle className={styles.copyIcon} /> : <Copy className={styles.copyIcon} />}
              </Button>
            </div>
            {/* Secondary address */}
            <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
              <Badge variant={!isEvmFocused ? 'default' : 'outline'} className={css({ fontSize: 'xs', minW: '3.5rem', justifyContent: 'center' })}>
                Bech32
              </Badge>
              <p className={cx(styles.addressText, css({ fontWeight: !isEvmFocused ? 'semibold' : 'normal' }))}>
                {bech32Addr}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className={styles.copyButton}
                onClick={() => bech32Addr && copyToClipboard(bech32Addr)}
              >
                <Copy className={styles.copyIcon} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader className={styles.statCardHeader}>
            <CardTitle className={styles.statCardTitle}>Total Transactions</CardTitle>
            <Activity className={styles.statCardIcon} />
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{formatNumber(stats.transaction_count)}</div>
            <p className={styles.statDescription}>
              All transactions involving this address
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={styles.statCardHeader}>
            <CardTitle className={styles.statCardTitle}>First Seen</CardTitle>
            <ArrowDownLeft className={styles.statCardIconGreen} />
          </CardHeader>
          <CardContent>
            <div className={styles.statValueSmall}>
              {stats.first_seen ? formatTimeAgo(stats.first_seen) : 'N/A'}
            </div>
            <p className={styles.statDescription}>
              {stats.first_seen ? new Date(stats.first_seen).toLocaleDateString() : 'No activity'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={styles.statCardHeader}>
            <CardTitle className={styles.statCardTitle}>Last Active</CardTitle>
            <Activity className={styles.statCardIconBlue} />
          </CardHeader>
          <CardContent>
            <div className={styles.statValueSmall}>
              {stats.last_seen ? formatTimeAgo(stats.last_seen) : 'N/A'}
            </div>
            <p className={styles.statDescription}>
              {stats.last_seen ? new Date(stats.last_seen).toLocaleDateString() : 'No activity'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={styles.statCardHeader}>
            <CardTitle className={styles.statCardTitle}>Account Type</CardTitle>
            {isContract ? <FileCode className={styles.statCardIcon} /> : <Wallet className={styles.statCardIcon} />}
          </CardHeader>
          <CardContent>
            <div className={styles.statValueSmall}>
              {isContract === undefined ? 'Loading...' : isContract ? 'Contract' : 'EOA'}
            </div>
            <p className={styles.statDescription}>
              {isContract === undefined ? 'Checking...' : isContract ? 'Smart contract' : 'Externally owned account'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <p className={styles.tableDescription}>
            All transactions involving this address
          </p>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className={styles.skeletonList}>
              <Skeleton className={styles.skeletonRow} />
              <Skeleton className={styles.skeletonRow} />
              <Skeleton className={styles.skeletonRow} />
            </div>
          ) : transactions && transactions.data.length > 0 ? (
            <>
              <div className={styles.tableContainer}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Tx Hash</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.data.map((tx) => {
                      const isOut = isSender(tx)
                      const isSuccess = !tx.error

                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Badge
                              variant={isOut ? 'default' : 'secondary'}
                              className={cn(
                                styles.typeBadge,
                                isOut ? styles.typeBadgeOut : styles.typeBadgeIn
                              )}
                            >
                              {isOut ? (
                                <>
                                  <ArrowUpRight className={styles.typeBadgeIcon} />
                                  OUT
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className={styles.typeBadgeIcon} />
                                  IN
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/tx/${tx.id}`}
                              className={styles.txHashLink}
                            >
                              {formatHash(tx.id, 8)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {tx.height ? (
                              <Link
                                to={`/blocks/${tx.height}`}
                                className={styles.blockLink}
                              >
                                {formatNumber(tx.height)}
                              </Link>
                            ) : (
                              <span className={styles.emptyValue}>—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tx.messages?.length || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isSuccess ? 'success' : 'destructive'}>
                              {isSuccess ? (
                                <>
                                  <CheckCircle className={styles.statusIcon} />
                                  Success
                                </>
                              ) : (
                                'Failed'
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className={styles.timeCell}>
                            {tx.timestamp ? formatTimeAgo(tx.timestamp) : 'Unavailable'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {transactions.pagination.total > pageSize && (
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, transactions.pagination.total)} of{' '}
                    {transactions.pagination.total} transactions
                  </div>
                  <div className={styles.paginationButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={!transactions.pagination.has_prev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!transactions.pagination.has_next}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <Activity className={styles.emptyStateIcon} />
              <p className={styles.emptyStateText}>No transactions found for this address</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const styles = {
  pageContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }),
  pageContainerLarge: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }),
  skeletonHeader: css({
    height: '2rem',
    width: '12rem',
  }),
  skeletonCard: css({
    height: '8rem',
    width: '100%',
  }),
  skeletonTable: css({
    height: '24rem',
    width: '100%',
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
  backIcon: css({
    height: '1rem',
    width: '1rem',
  }),
  cardPadding: css({
    paddingTop: '1.5rem',
  }),
  notFoundContainer: css({
    textAlign: 'center',
    paddingY: '3rem',
  }),
  notFoundIcon: css({
    height: '3rem',
    width: '3rem',
    color: 'fg.muted',
    marginX: 'auto',
    marginBottom: '1rem',
  }),
  notFoundTitle: css({
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'fg.muted',
    marginBottom: '0.5rem',
  }),
  notFoundText: css({
    color: 'fg.muted',
  }),
  headerContent: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  }),
  headerIcon: css({
    height: '2rem',
    width: '2rem',
    color: 'accent.default',
  }),
  headerTitle: css({
    fontSize: '1.875rem',
    fontWeight: 'bold',
  }),
  addressContainer: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'bg.muted',
    padding: '0.75rem',
    borderRadius: 'lg',
  }),
  addressText: css({
    fontFamily: 'mono',
    fontSize: 'sm',
    wordBreak: 'break-all',
    flex: '1',
  }),
  copyButton: css({
    height: '2rem',
    width: '2rem',
    flexShrink: '0',
  }),
  copyIcon: css({
    height: '1rem',
    width: '1rem',
  }),
  statsGrid: css({
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: {
      base: '1fr',
      md: 'repeat(2, 1fr)',
      lg: 'repeat(4, 1fr)',
    },
  }),
  statCardHeader: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    spaceY: '0',
    paddingBottom: '0.5rem',
  }),
  statCardTitle: css({
    fontSize: 'sm',
    fontWeight: 'medium',
  }),
  statCardIcon: css({
    height: '1rem',
    width: '1rem',
    color: 'fg.muted',
  }),
  statCardIconBlue: css({
    height: '1rem',
    width: '1rem',
    color: 'blue.500',
  }),
  statCardIconGreen: css({
    height: '1rem',
    width: '1rem',
    color: 'green.500',
  }),
  statValue: css({
    fontSize: '1.5rem',
    fontWeight: 'bold',
  }),
  statValueSmall: css({
    fontSize: '1.125rem',
    fontWeight: 'bold',
  }),
  statDescription: css({
    fontSize: 'xs',
    color: 'fg.muted',
    marginTop: '0.25rem',
  }),
  tableDescription: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  skeletonList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }),
  skeletonRow: css({
    height: '3rem',
    width: '100%',
  }),
  tableContainer: css({
    borderRadius: 'md',
    border: '1px solid',
    borderColor: 'border.default',
    overflowX: 'auto',
  }),
  typeBadge: css({
    fontWeight: 'medium',
  }),
  typeBadgeOut: css({
    backgroundColor: 'blue.500',
    _hover: {
      backgroundColor: 'blue.600',
    },
  }),
  typeBadgeIn: css({
    backgroundColor: 'green.500',
    _hover: {
      backgroundColor: 'green.600',
    },
  }),
  typeBadgeIcon: css({
    height: '0.75rem',
    width: '0.75rem',
    marginRight: '0.25rem',
  }),
  txHashLink: css({
    fontFamily: 'mono',
    fontSize: 'sm',
    color: 'accent.default',
    _hover: {
      color: 'accent.default/80',
    },
  }),
  blockLink: css({
    color: 'accent.default',
    _hover: {
      color: 'accent.default/80',
    },
  }),
  emptyValue: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  statusIcon: css({
    height: '0.75rem',
    width: '0.75rem',
    marginRight: '0.25rem',
  }),
  timeCell: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  paginationContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '1rem',
  }),
  paginationInfo: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
  paginationButtons: css({
    display: 'flex',
    gap: '0.5rem',
  }),
  emptyState: css({
    textAlign: 'center',
    paddingY: '3rem',
  }),
  emptyStateIcon: css({
    height: '3rem',
    width: '3rem',
    color: 'fg.muted',
    marginX: 'auto',
    marginBottom: '1rem',
  }),
  emptyStateText: css({
    color: 'fg.muted',
  }),
}
