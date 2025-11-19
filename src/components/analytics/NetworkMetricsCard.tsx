import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, Clock, Database, Users, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getNetworkMetrics } from '@/lib/metrics'
import { type NetworkMetrics } from '@/types/lib/metrics'

export function NetworkMetricsCard() {
  const { data: metrics, isLoading } = useQuery<NetworkMetrics>({
    queryKey: ['network-metrics'],
    queryFn: getNetworkMetrics,
    refetchInterval: 10000, // Poll every 10 seconds
  })

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate time since last block
  const timeSinceLastBlock = Math.floor(
    (Date.now() - new Date(metrics.lastBlockTime).getTime()) / 1000
  )

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const metricsData = [
    {
      icon: Activity,
      label: 'Latest Block',
      value: metrics.latestHeight.toLocaleString(),
      subtext: `${timeSinceLastBlock}s ago`,
      color: 'text-blue-500'
    },
    {
      icon: Database,
      label: 'Total Transactions',
      value: formatNumber(metrics.totalTransactions),
      subtext: `${metrics.txPerBlock} per block`,
      color: 'text-green-500'
    },
    {
      icon: Clock,
      label: 'Block Time',
      value: `${metrics.avgBlockTime.toFixed(2)}s`,
      subtext: 'average',
      color: 'text-purple-500'
    },
    {
      icon: Users,
      label: 'Active Validators',
      value: metrics.activeValidators.toString(),
      subtext: 'participating',
      color: 'text-orange-500'
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      subtext: 'transactions',
      color: 'text-emerald-500'
    },
    {
      icon: Zap,
      label: 'Avg Gas Limit',
      value: formatNumber(metrics.avgGasLimit),
      subtext: 'per transaction',
      color: 'text-yellow-500'
    },
    {
      icon: Database,
      label: 'Total Blocks',
      value: formatNumber(metrics.totalBlocks),
      subtext: 'indexed',
      color: 'text-indigo-500'
    },
    {
      icon: Users,
      label: 'Active Addresses',
      value: metrics.uniqueAddresses?.toString() ?? '-',
      subtext: 'distinct senders (sample)',
      color: 'text-pink-500'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Network Overview</CardTitle>
        <CardDescription>
          Real-time metrics and statistics for the blockchain network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {metricsData.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-xs text-muted-foreground">{metric.subtext}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
