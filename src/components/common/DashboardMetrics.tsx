import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Blocks, Activity, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { getOverviewMetrics } from '@/lib/metrics'
import { css } from '@/styled-system/css'
import { ValidatorIcon } from '@/components/icons/icons'

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

  const activeValidators = stats?.activeValidators ?? 0
  const hasActiveValidators = activeValidators > 0
  const avgBlockTime = stats?.avgBlockTime ?? 0

  return (
    <>
      {/* Primary Stats */}
      <div className={css({
        display: 'grid',
        gap: '4',
        gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }
      })}>
        <Card>
          <CardHeader className={css(styles.cardHeader)}>
            <CardTitle className={css(styles.cardTitle)}>Latest Block</CardTitle>
            <Blocks className={css(styles.icon)} />
          </CardHeader>
          <CardContent>
            <div className={css(styles.valueText)}>
              {statsLoading ? <Skeleton className={css(styles.skeletonLarge)} /> : formatNumber(stats?.latestBlock || 0)}
            </div>
            <p className={css(styles.helperText)}>
              {avgBlockTime.toFixed(2)}s avg block time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={css(styles.cardHeader)}>
            <CardTitle className={css(styles.cardTitle)}>Transactions</CardTitle>
            <Activity className={css(styles.icon)} />
          </CardHeader>
          <CardContent>
            <div className={css(styles.valueText)}>
              {statsLoading ? <Skeleton className={css(styles.skeletonLarge)} /> : formatNumber(stats?.totalTransactions || 0)}
            </div>
            <p className={css(styles.helperText)}>
              Total indexed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={css(styles.cardHeader)}>
            <CardTitle className={css(styles.cardTitle)}>Active Validators</CardTitle>
            <ValidatorIcon className={css(styles.icon)} />
          </CardHeader>
          <CardContent>
            <div className={css(styles.valueText)}>
              {statsLoading ? (
                <Skeleton className={css(styles.skeletonLarge)} />
              ) : hasActiveValidators ? (
                activeValidators
              ) : (
                <span className={css(styles.mutedValue)}>-</span>
              )}
            </div>
            <p className={css(styles.helperText)}>
              {hasActiveValidators ? 'Active set' : 'Fetching validator data...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={css(styles.cardHeader)}>
            <CardTitle className={css(styles.cardTitle)}>Total Supply</CardTitle>
            <TrendingUp className={css(styles.icon)} />
          </CardHeader>
          <CardContent>
            <div className={css(styles.valueText)}>
              {statsLoading ? (
                <Skeleton className={css(styles.skeletonLarge)} />
              ) : stats?.totalSupply ? (
                stats.totalSupply
              ) : (
                <span className={css(styles.mutedValue)}>-</span>
              )}
            </div>
            <p className={css(styles.helperText)}>
              {stats?.totalSupply ? 'Native Token' : 'Not available'}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

const styles = {
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    spaceY: '0',
    paddingBottom: '0.5rem',
  },
  cardTitle: {
    fontSize: 'sm',
    fontWeight: 'medium',
  },
  icon: {
    height: '1rem',
    width: '1rem',
    color: 'fg.muted',
  },
  valueText: {
    fontSize: '2xl',
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 'xs',
    color: 'fg.muted',
  },
  mutedValue: {
    color: 'fg.muted',
    fontSize: 'base',
  },
  skeletonLarge: {
    height: '2rem',
    width: '6rem',
  },
}
