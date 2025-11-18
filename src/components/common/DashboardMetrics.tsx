import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Blocks, Activity, TrendingUp, Users, Gauge, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDenomAmount } from '@/lib/denom'
import { DenomDisplay } from '@/components/common/DenomDisplay'

const api = new YaciAPIClient()

/**
 * Dashboard metrics component displaying key chain statistics
 * Reusable across dashboard and analytics pages
 */
export function DashboardMetrics() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['chainStats'],
    queryFn: async () => {
      const result = await api.getChainStats()
      return result
    },
    refetchInterval: 5000,
    enabled: mounted,
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

  const activeValidators = stats?.active_validators ?? 0
  const hasActiveValidators = activeValidators > 0
  const avgBlockTime = stats?.avg_block_time ?? 0

  return (
    <>
      {/* Primary Stats */}
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
              {avgBlockTime.toFixed(2)}s avg block time
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
              {formatNumber(stats?.tps || 0, 2)} TPS (indexed)
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
              ) : hasActiveValidators ? (
                activeValidators
              ) : (
                <span className="text-muted-foreground text-base">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActiveValidators ? 'Active set' : 'Fetching validator data...'}
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

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
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
            <CardTitle className="text-sm font-medium">Avg Gas Limit</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {!gasEfficiency ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `${(gasEfficiency.avgGasLimit / 1000).toFixed(0)}K`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {gasEfficiency && `from recent ${formatNumber(gasEfficiency.transactionCount)} txs`}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
