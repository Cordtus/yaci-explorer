import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, User, ArrowUpRight, ArrowDownLeft, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber, formatTimeAgo, formatHash, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EnhancedTransaction } from '@/types/blockchain'

const api = new YaciAPIClient()

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

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch address statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['address-stats', params.id],
    queryFn: async () => {
      return await api.getAddressStats(params.id!)
    },
    enabled: mounted && !!params.id,
  })

  // Fetch transactions for this address
  const { data: transactions, isLoading: txLoading} = useQuery({
    queryKey: ['address-transactions', params.id, page],
    queryFn: async () => {
      return await api.getTransactionsByAddress(params.id!, pageSize, page * pageSize)
    },
    enabled: mounted && !!params.id,
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Address Not Found</h2>
              <p className="text-muted-foreground">
                No transactions found for this address.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Address Details</h1>
        </div>
        <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
          <p className="font-mono text-sm break-all flex-1">
            {params.id}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => copyToClipboard(params.id!)}
          >
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.transaction_count)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All transactions involving this address
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_sent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Messages originated from this address
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Received</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_received)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Messages mentioning this address
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Seen</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {stats.first_seen ? formatTimeAgo(stats.first_seen) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.first_seen ? new Date(stats.first_seen).toLocaleDateString() : 'No activity'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <p className="text-sm text-muted-foreground">
            All transactions involving this address
          </p>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : transactions && transactions.data.length > 0 ? (
            <>
              <div className="rounded-md border overflow-x-auto">
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
                                'font-medium',
                                isOut ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                              )}
                            >
                              {isOut ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  OUT
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className="h-3 w-3 mr-1" />
                                  IN
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/transactions/${tx.id}`}
                              className="font-mono text-sm text-primary hover:text-primary/80"
                            >
                              {formatHash(tx.id, 8)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/blocks/${tx.height}`}
                              className="text-primary hover:text-primary/80"
                            >
                              {formatNumber(tx.height)}
                            </Link>
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
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Success
                                </>
                              ) : (
                                'Failed'
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTimeAgo(tx.timestamp)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {transactions.pagination.total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, transactions.pagination.total)} of{' '}
                    {transactions.pagination.total} transactions
                  </div>
                  <div className="flex gap-2">
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
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions found for this address</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
