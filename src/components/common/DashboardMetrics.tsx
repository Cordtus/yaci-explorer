import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Blocks, Activity, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { getOverviewMetrics } from '@/lib/metrics'
import { css } from '@/styled-system/css'
import { grid, hstack } from '@/styled-system/patterns'
import { ValidatorIcon } from '@/components/icons/icons'

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
		<div className={grid({ columns: { base: 1, md: 2, lg: 4 }, gap: '4' })}>
			<Card>
				<CardHeader className={hstack({ justify: 'space-between', pb: '2' })}>
					<CardTitle className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Latest Block</CardTitle>
					<Blocks className={css({ w: 'icon.sm', h: 'icon.sm', color: 'fg.muted' })} />
				</CardHeader>
				<CardContent>
					<div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
						{statsLoading ? <Skeleton className={css({ h: '8', w: '24' })} /> : formatNumber(stats?.latestBlock || 0)}
					</div>
					<p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
						{avgBlockTime.toFixed(2)}s avg block time
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className={hstack({ justify: 'space-between', pb: '2' })}>
					<CardTitle className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Transactions</CardTitle>
					<Activity className={css({ w: 'icon.sm', h: 'icon.sm', color: 'fg.muted' })} />
				</CardHeader>
				<CardContent>
					<div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
						{statsLoading ? <Skeleton className={css({ h: '8', w: '24' })} /> : formatNumber(stats?.totalTransactions || 0)}
					</div>
					<p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
						Total indexed
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className={hstack({ justify: 'space-between', pb: '2' })}>
					<CardTitle className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Active Validators</CardTitle>
					<ValidatorIcon className={css({ w: 'icon.sm', h: 'icon.sm', color: 'fg.muted' })} />
				</CardHeader>
				<CardContent>
					<div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
						{statsLoading ? (
							<Skeleton className={css({ h: '8', w: '24' })} />
						) : hasActiveValidators ? (
							activeValidators
						) : (
							<span className={css({ color: 'fg.muted', fontSize: 'base' })}>-</span>
						)}
					</div>
					<p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
						{hasActiveValidators ? 'Active set' : 'Fetching validator data...'}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className={hstack({ justify: 'space-between', pb: '2' })}>
					<CardTitle className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Total Supply</CardTitle>
					<TrendingUp className={css({ w: 'icon.sm', h: 'icon.sm', color: 'fg.muted' })} />
				</CardHeader>
				<CardContent>
					<div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
						{statsLoading ? (
							<Skeleton className={css({ h: '8', w: '24' })} />
						) : stats?.totalSupply ? (
							stats.totalSupply
						) : (
							<span className={css({ color: 'fg.muted', fontSize: 'base' })}>-</span>
						)}
					</div>
					<p className={css({ fontSize: 'xs', color: 'fg.muted' })}>
						{stats?.totalSupply ? 'Native Token' : 'Not available'}
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
