import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Blocks, Activity, TrendingUp, Users, Gauge, DollarSign, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber, formatTimeAgo, formatHash, getTransactionStatus } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { getNetworkHealth } from '@/lib/api/prometheus'
import { formatDenomAmount } from '@/lib/denom'
import { DenomDisplay } from '@/components/common/DenomDisplay'

const api = new YaciAPIClient()

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['chainStats'],
    queryFn: async () => {
      const result = await api.getChainStats()
      return result
    },
    refetchInterval: 5000,
    enabled: mounted, // Only run after client mount
  })

  const { data: blocks, isLoading: blocksLoading, error: blocksError } = useQuery({
    queryKey: ['latestBlocks'],
    queryFn: async () => {
      const result = await api.getBlocks(5, 0)
      return result
    },
    refetchInterval: 2000,
    enabled: mounted, // Only run after client mount
  })

  const { data: transactions, isLoading: txLoading, error: txError } = useQuery({
    queryKey: ['latestTransactions'],
    queryFn: async () => {
      const result = await api.getTransactions(5, 0)
      return result
    },
    refetchInterval: 2000,
    enabled: mounted, // Only run after client mount
  })

  const { data: feeRevenue } = useQuery({
    queryKey: ['feeRevenue'],
    queryFn: () => api.getTotalFeeRevenue(),
    refetchInterval: 30000,
    enabled: mounted,
  })

  const { data: gasEfficiency } = useQuery({
    queryKey: ['gasEfficiency'],
    queryFn: () => api.getGasEfficiency(1000),
    refetchInterval: 30000,
    enabled: mounted,
  })

  const { data: networkHealth } = useQuery({
    queryKey: ['networkHealth'],
    queryFn: () => getNetworkHealth(),
    refetchInterval: 6000,
    enabled: mounted,
  })

  const { data: gasPrice } = useQuery({
    queryKey: ['gasPrice'],
    queryFn: () => api.getAverageGasPrice(),
    refetchInterval: 30000,
    enabled: mounted,
  })

  // Display errors if any
  if (mounted && (statsError || blocksError || txError)) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Error Loading Data</h2>
        {statsError && <p className="text-red-500">Stats error: {String(statsError)}</p>}
        {blocksError && <p className="text-red-500">Blocks error: {String(blocksError)}</p>}
        {txError && <p className="text-red-500">Transactions error: {String(txError)}</p>}
        <p className="text-sm text-muted-foreground">API URL: {api['baseUrl']}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
            <Blocks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.latest_block || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.avg_block_time}s avg block time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.total_transactions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats?.tps || 0, 2)} TPS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : stats?.active_validators > 0 ? (
                stats.active_validators
              ) : (
                <span className="text-muted-foreground text-base">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_validators > 0 ? 'Active set' : 'Fetching validator data...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : stats?.total_supply && stats.total_supply !== '0' ? (
                formatNumber(stats.total_supply)
              ) : (
                <span className="text-muted-foreground text-base">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_supply && stats.total_supply !== '0' ? 'Native Token' : 'Requires gRPC query'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fee Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {!feeRevenue ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(feeRevenue).map(([denom, amount]) => {
                    const formatted = formatDenomAmount(amount, denom, { maxDecimals: 2 })
                    return (
                      <span key={denom} className="inline-flex items-center gap-1">
                        {formatted} <DenomDisplay denom={denom} />
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">From recent transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Efficiency</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {!gasEfficiency ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `${gasEfficiency.avgEfficiency.toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {gasEfficiency && `${(gasEfficiency.totalUsed / 1e6).toFixed(1)}M of ${(gasEfficiency.totalLimit / 1e6).toFixed(1)}M used`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Gas Price</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {!gasPrice || gasPrice.length === 0 ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {gasPrice.map((gp) => (
                    <span key={gp.denom} className="inline-flex items-center gap-1">
                      {gp.avgPrice.toFixed(4)} <DenomDisplay denom={gp.denom} />
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per gas unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mempool Size</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {!networkHealth ? <Skeleton className="h-8 w-24" /> : networkHealth.mempoolSize}
            </div>
            <p className="text-xs text-muted-foreground">
              {networkHealth && `${(networkHealth.mempoolBytes / 1024).toFixed(1)}KB total`}
            </p>
          </CardContent>
        </Card>
      </div>

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
