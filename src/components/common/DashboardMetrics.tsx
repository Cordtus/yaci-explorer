import { useQuery } from "@tanstack/react-query"
import {
	Activity,
	Blocks,
	DollarSign,
	Gauge,
	TrendingUp,
	Users
} from "lucide-react"
import { useEffect, useState } from "react"
import { DenomDisplay } from "@/components/common/DenomDisplay"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { YaciAPIClient } from "@/lib/api/client"
import { formatDenomAmount } from "@/lib/denom"
import { getOverviewMetrics } from "@/lib/metrics"
import { formatNumber } from "@/lib/utils"
import { css } from "@/styled-system/css"

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
		queryKey: ["overview-metrics"],
		queryFn: getOverviewMetrics,
		refetchInterval: 10000,
		enabled: mounted
	})

	const { data: feeRevenue } = useQuery({
		queryKey: ["feeRevenue"],
		queryFn: () => api.getTotalFeeRevenue(),
		refetchInterval: 30000,
		enabled: mounted
	})

	const { data: gasEfficiency } = useQuery({
		queryKey: ["gasEfficiency"],
		queryFn: () => api.getGasEfficiency(),
		refetchInterval: 30000,
		enabled: mounted
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
					<CardContent className={styles.cardContent}>
						<div className={styles.value}>
							{statsLoading ? (
								<Skeleton className={styles.skeletonValue} />
							) : (
								formatNumber(stats?.latest_block || 0)
							)}
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
					<CardContent className={styles.cardContent}>
						<div className={styles.value}>
							{statsLoading ? (
								<Skeleton className={styles.skeletonValue} />
							) : (
								formatNumber(stats?.total_transactions || 0)
							)}
						</div>
						<p className={styles.subdued}>
							{formatNumber(stats?.tps || 0, 2)} TPS (indexed)
						</p>
					</CardContent>
				</Card>

				<Card className={styles.statCard}>
					<CardHeader className={styles.cardHeader}>
						<CardTitle className={styles.cardTitle}>
							Active Validators
						</CardTitle>
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
							{hasActiveValidators
								? "Active set"
								: "Fetching validator data..."}
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
								<Skeleton className={styles.skeletonValue} />
							) : stats?.total_supply && stats.total_supply !== "0" ? (
								formatNumber(stats.total_supply)
							) : (
								<span className="text-muted-foreground text-base">-</span>
							)}
						</div>
						<p className={styles.subdued}>
							{stats?.total_supply && stats.total_supply !== "0"
								? "Native Token"
								: "Requires gRPC query"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Secondary Metrics */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card className={styles.statCard}>
					<CardHeader className={styles.cardHeader}>
						<CardTitle className={styles.cardTitle}>
							Total Fee Revenue
						</CardTitle>
						<DollarSign className={styles.icon} />
					</CardHeader>
					<CardContent className={styles.cardContent}>
						<div className={styles.value}>
							{!feeRevenue ? (
								<Skeleton className="h-8 w-24" />
							) : (
								<div className={styles.revenueWrap}>
									{Object.entries(feeRevenue).map(([denom, amount]) => {
										const formatted = formatDenomAmount(amount, denom, {
											maxDecimals: 2
										})
										return (
											<span key={denom} className={styles.revenueItem}>
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
					<CardContent className={styles.cardContent}>
						<div className={styles.value}>
							{!gasEfficiency ? (
								<Skeleton className={styles.skeletonValue} />
							) : (
								`${(gasEfficiency.avgGasLimit / 1000).toFixed(0)}K`
							)}
						</div>
						<p className={styles.subdued}>
							{gasEfficiency &&
								`from recent ${formatNumber(gasEfficiency.transactionCount)} txs`}
						</p>
					</CardContent>
				</Card>
			</div>
		</>
	)
}
