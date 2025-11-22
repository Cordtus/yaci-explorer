import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Blocks, Activity, TrendingUp, Users, Gauge, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { YaciAPIClient } from '@yaci/database-client'
import { formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDenomAmount } from '@/lib/denom'
import { DenomDisplay } from '@/components/common/DenomDisplay'
import { getOverviewMetrics } from '@/lib/metrics'

const api = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

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
    queryKey: ['overview-metrics'],
    queryFn: getOverviewMetrics,
    refetchInterval: 10000,
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

  const activeValidators = stats?.activeValidators ?? 0
  const hasActiveValidators = activeValidators > 0
  const avgBlockTime = stats?.avgBlockTime ?? 0

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
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.latestBlock || 0)}
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
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatNumber(stats?.totalTransactions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total indexed
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
              ) : stats?.totalSupply ? (
                stats.totalSupply
              ) : (
                <span className="text-muted-foreground text-base">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalSupply ? 'Native Token' : 'Not available'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {!feeRevenue ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <div className="flex flex-col gap-1">
                  {Object.entries(feeRevenue).slice(0, 2).map(([denom, amount]) => {
                    const formatted = formatDenomAmount(amount, denom, { maxDecimals: 2 })
                    return (
                      <span key={denom} className="inline-flex items-center gap-1 text-sm">
                        {formatted} <DenomDisplay denom={denom} />
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Gas Limit</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {!gasEfficiency ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                `${(gasEfficiency.avgGasLimit / 1000).toFixed(0)}K`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {gasEfficiency && `${formatNumber(gasEfficiency.transactionCount)} txs`}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
