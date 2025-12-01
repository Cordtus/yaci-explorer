import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, Clock, Database, Users, Zap, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'
import { api } from '@/lib/api'
import { formatDenomAmount } from '@/lib/denom'
import { DenomDisplay } from '@/components/common/DenomDisplay'
import { getNetworkMetrics } from '@/lib/metrics'

export function NetworkMetricsCard() {
	const { data: metrics, isLoading } = useQuery({
		queryKey: ['network-metrics'],
		queryFn: getNetworkMetrics,
		refetchInterval: appConfig.analytics.networkRefetchMs,
	})

	const { data: feeRevenue } = useQuery({
		queryKey: ['feeRevenue'],
		queryFn: () => api.getTotalFeeRevenue(),
		refetchInterval: 30000,
	})

	if (isLoading || !metrics) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Network Overview</CardTitle>
					<CardDescription>Loading metrics...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className={styles.animatePulse}>
						<div className={styles.skeletonGrid}>
							{[...Array(8)].map((_, i) => (
								<div key={i} className={styles.skeletonItem}>
									<div className={styles.skeletonBar}></div>
									<div className={styles.skeletonText}></div>
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

	// Format fee revenue for display
	const feeRevenueDisplay = feeRevenue
		? Object.entries(feeRevenue).slice(0, 2).map(([denom, amount]) => ({
				denom,
				formatted: formatDenomAmount(amount, denom, { maxDecimals: 2 })
			}))
		: []

	const metricsData = [
		{
			icon: Activity,
			label: 'Latest Block',
			value: metrics.latestHeight.toLocaleString(),
			subtext: `${timeSinceLastBlock}s ago`,
			color: 'blue.500'
		},
		{
			icon: Database,
			label: 'Total Transactions',
			value: formatNumber(metrics.totalTransactions),
			subtext: `${metrics.txPerBlock} per block`,
			color: 'green.500'
		},
		{
			icon: Clock,
			label: 'Block Time',
			value: `${metrics.avgBlockTime.toFixed(2)}s`,
			subtext: 'average',
			color: 'purple.500'
		},
		{
			icon: Users,
			label: 'Active Validators',
			value: metrics.activeValidators.toString(),
			subtext: 'participating',
			color: 'orange.500'
		},
		{
			icon: TrendingUp,
			label: 'Success Rate',
			value: `${metrics.successRate.toFixed(1)}%`,
			subtext: 'transactions',
			color: 'emerald.500'
		},
		{
			icon: Zap,
			label: 'Avg Gas Limit',
			value: formatNumber(metrics.avgGasLimit),
			subtext: 'per transaction',
			color: 'yellow.500'
		},
		{
			icon: Database,
			label: 'Total Blocks',
			value: formatNumber(metrics.totalBlocks),
			subtext: 'indexed',
			color: 'indigo.500'
		},
		{
			icon: Users,
			label: 'Active Addresses',
			value: metrics.uniqueAddresses?.toString() ?? '-',
			subtext: 'unique senders',
			color: 'pink.500'
		},
		{
			icon: DollarSign,
			label: 'Fee Revenue',
			value: feeRevenueDisplay.length > 0 ? feeRevenueDisplay[0].formatted : '-',
			subtext: feeRevenueDisplay.length > 0 ? 'total collected' : 'loading...',
			color: 'cyan.500',
			customRender: feeRevenueDisplay.length > 0 ? (
				<div className={css({ display: 'flex', flexDir: 'column', gap: '1' })}>
					{feeRevenueDisplay.map(({ denom, formatted }) => (
						<span key={denom} className={css({ display: 'inline-flex', alignItems: 'center', gap: '1', fontSize: 'sm' })}>
							{formatted} <DenomDisplay denom={denom} />
						</span>
					))}
				</div>
			) : null
		}
	]

	return (
		<Card>
			<CardHeader>
				<CardTitle className={styles.title}>Network Overview</CardTitle>
				<CardDescription>
					Real-time metrics and statistics for the blockchain network
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className={styles.metricsGrid}>
					{metricsData.map((metric, index) => {
						const Icon = metric.icon
						return (
							<div key={index} className={styles.metricItem}>
								<div className={styles.metricHeader}>
									<Icon className={css({ h: '5', w: '5', color: metric.color })} />
									<span className={styles.metricLabel}>
										{metric.label}
									</span>
								</div>
								<div className={styles.metricValues}>
									{'customRender' in metric && metric.customRender ? (
										metric.customRender
									) : (
										<div className={styles.metricValue}>{metric.value}</div>
									)}
									<div className={styles.metricSubtext}>{metric.subtext}</div>
								</div>
							</div>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}

const styles = {
	title: css({ fontSize: '2xl' }),
	animatePulse: css({ animation: 'pulse', display: 'flex', flexDirection: 'column', gap: '4' }),
	skeletonGrid: css({ display: 'grid', gridTemplateColumns: { base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: '4' }),
	skeletonItem: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
	skeletonBar: css({ h: '8', bg: 'muted', rounded: 'md' }),
	skeletonText: css({ h: '4', bg: 'muted', rounded: 'md', w: '2/3' }),
	metricsGrid: css({ display: 'grid', gridTemplateColumns: { base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: '6' }),
	metricItem: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
	metricHeader: css({ display: 'flex', alignItems: 'center', gap: '2' }),
	metricLabel: css({ fontSize: 'sm', fontWeight: 'medium', color: 'fg.muted' }),
	metricValues: css({ display: 'flex', flexDirection: 'column', gap: '1' }),
	metricValue: css({ fontSize: '2xl', fontWeight: 'bold' }),
	metricSubtext: css({ fontSize: 'xs', color: 'fg.muted' }),
}
