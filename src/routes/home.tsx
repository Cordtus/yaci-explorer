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
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Error Loading Data</h2>
        {blocksError && <p className="text-red-500">Blocks error: {String(blocksError)}</p>}
        {txError && <p className="text-red-500">Transactions error: {String(txError)}</p>}
        <p className="text-sm text-muted-foreground">API URL: {api['baseUrl']}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Metrics */}
      <DashboardMetrics />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Latest Blocks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Blocks</CardTitle>
            <Link
              to="/blocks"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blocksLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                blocks?.data.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Blocks className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Link
                          to={`/blocks/${block.id}`}
                          className="font-medium hover:text-primary"
                        >
                          Block #{block.id}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {block.data?.block?.header?.time ? formatTimeAgo(block.data.block.header.time) : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {block.data?.txs?.length || 0} txs
                      </div>
                      <div className="text-xs text-muted-foreground">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Transactions</CardTitle>
            <Link
              to="/transactions"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (
                transactions?.data.map((tx) => {
                  const status = getTransactionStatus(tx.error)
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <Link
                            to={`/transactions/${tx.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {formatHash(tx.id, 8)}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {formatTimeAgo(tx.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={tx.error ? 'destructive' : 'success'}
                          className="mb-1"
                        >
                          {status.label}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
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
