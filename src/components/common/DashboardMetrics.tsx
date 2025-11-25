import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Blocks, Activity, TrendingUp, Users, Gauge, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { YaciAPIClient } from '@/lib/api/client'
import { formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDenomAmount } from '@/lib/denom'
import { DenomDisplay } from '@/components/common/DenomDisplay'
import { css } from '@/styled-system/css'

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
      <div className={styles.primaryGrid}>
        <Card className={styles.statCard}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>Latest Block</CardTitle>
            <Blocks className={styles.icon} />
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.value}>
              {statsLoading ? <Skeleton className={styles.skeletonValue} /> : formatNumber(stats?.latest_block || 0)}
            </div>
            <p className={styles.subdued}>
              {avgBlockTime.toFixed(2)}s avg block time
            </p>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>Transactions</CardTitle>
            <Activity className={styles.icon} />
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.value}>
              {statsLoading ? <Skeleton className={styles.skeletonValue} /> : formatNumber(stats?.total_transactions || 0)}
            </div>
            <p className={styles.subdued}>
              {formatNumber(stats?.tps || 0, 2)} TPS (indexed)
            </p>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>Active Validators</CardTitle>
            <Users className={styles.icon} />
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.value}>
              {statsLoading ? (
                <Skeleton className={styles.skeletonValue} />
              ) : hasActiveValidators ? (
                activeValidators
              ) : (
                <span className={styles.valuePlaceholder}>-</span>
              )}
            </div>
            <p className={styles.subdued}>
              {hasActiveValidators ? 'Active set' : 'Fetching validator data...'}
            </p>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>Total Supply</CardTitle>
            <TrendingUp className={styles.icon} />
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.value}>
              {statsLoading ? (
                <Skeleton className={styles.skeletonValue} />
              ) : stats?.total_supply && stats.total_supply !== '0' ? (
                formatNumber(stats.total_supply)
              ) : (
                <span className={styles.valuePlaceholder}>-</span>
              )}
            </div>
            <p className={styles.subdued}>
              {stats?.total_supply && stats.total_supply !== '0' ? 'Native Token' : 'Requires gRPC query'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div
        className={styles.secondaryGrid}
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
      >
        <Card className={styles.statCard}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>Total Fee Revenue</CardTitle>
            <DollarSign className={styles.icon} />
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.value}>
              {!feeRevenue ? (
                <Skeleton className={styles.skeletonValue} />
              ) : (
                <div className={styles.revenueWrap}>
                  {Object.entries(feeRevenue).map(([denom, amount]) => {
                    const formatted = formatDenomAmount(amount, denom, { maxDecimals: 2 })
                    return (
                      <span key={denom} className={styles.revenueItem}>
                        {formatted} <DenomDisplay denom={denom} />
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
            <p className={styles.subdued}>From recent transactions</p>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>Avg Gas Limit</CardTitle>
            <Gauge className={styles.icon} />
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.value}>
              {!gasEfficiency ? (
                <Skeleton className={styles.skeletonValue} />
              ) : (
                `${(gasEfficiency.avgGasLimit / 1000).toFixed(0)}K`
              )}
            </div>
            <p className={styles.subdued}>
              {gasEfficiency && `from recent ${formatNumber(gasEfficiency.transactionCount)} txs`}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

const styles = {
  primaryGrid: css({
    display: 'grid',
    gap: '4',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  }),
  secondaryGrid: css({
    display: 'grid',
    gap: '4',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  }),
  statCard: css({
    borderWidth: '1px',
    borderColor: 'border.subtle',
    boxShadow: 'none',
    bg: 'bg.default',
    textAlign: 'left',
    minH: '28',
  }),
  cardHeader: css({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '2',
    pb: '0',
    pt: '4',
    px: '5',
    textAlign: 'left',
  }),
  cardTitle: css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'fg.default',
    letterSpacing: '-0.01em',
    textAlign: 'left',
  }),
  icon: css({
    h: '4',
    w: '4',
    color: 'fg.subtle',
  }),
  cardContent: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
    alignItems: 'flex-start',
    px: '5',
    pb: '4',
    flex: '0 0 auto',
    textAlign: 'left',
  }),
  value: css({
    fontSize: '3xl',
    fontWeight: 'bold',
    color: 'fg.default',
    letterSpacing: '-0.02em',
  }),
  valuePlaceholder: css({
    color: 'fg.muted',
    fontSize: 'lg',
    fontWeight: 'medium',
  }),
  skeletonValue: css({
    h: '8',
    w: '24',
    borderRadius: 'full',
  }),
  subdued: css({
    fontSize: 'xs',
    color: 'fg.muted',
    lineHeight: 'short',
  }),
  revenueWrap: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2',
    alignItems: 'center',
  }),
  revenueItem: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    fontSize: 'lg',
    fontWeight: 'semibold',
  }),
}
