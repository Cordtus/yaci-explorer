import { useQuery } from "@tanstack/react-query"
import { Activity, Clock, Database, Shield, TrendingUp, Users, Zap } from "lucide-react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useChain } from "@/contexts/ChainContext"
import { css } from "@/styled-system/css"
import type { LucideIcon } from "lucide-react"

function formatNumber(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
	return num.toLocaleString()
}

interface MetricItem {
	icon: LucideIcon
	label: string
	value: string
	subtext: string
}

export function NetworkMetricsCard() {
	const { api, chainInfo } = useChain()

	const { data: chainStats, isLoading: statsLoading } = useQuery({
		queryKey: ["chain-stats", chainInfo.chainId],
		queryFn: () => api.getChainStats(),
		staleTime: 10_000,
		refetchInterval: 15_000,
	})

	const { data: successRate } = useQuery({
		queryKey: ["tx-success-rate", chainInfo.chainId],
		queryFn: () => api.getTxSuccessRate(),
		staleTime: 30_000,
	})

	const { data: networkOverview, isLoading: overviewLoading } = useQuery({
		queryKey: ["network-overview", chainInfo.chainId],
		queryFn: () => api.getNetworkOverview(),
		staleTime: 15_000,
		refetchInterval: 30_000,
	})

	const isLoading = statsLoading || overviewLoading

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Network Overview</CardTitle>
					<CardDescription>Loading metrics...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className={gridStyle}>
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className={css({ display: "flex", flexDir: "column", gap: "2" })}>
								<Skeleton className={css({ h: "8", w: "full" })} />
								<Skeleton className={css({ h: "4", w: "2/3" })} />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	const metrics: MetricItem[] = []

	if (chainStats) {
		metrics.push(
			{
				icon: Activity,
				label: "Latest Block",
				value: chainStats.latest_block.toLocaleString(),
				subtext: `avg ${chainStats.avg_block_time.toFixed(2)}s block time`,
			},
			{
				icon: Database,
				label: "Total Transactions",
				value: formatNumber(chainStats.total_transactions),
				subtext: chainStats.latest_block > 0
					? `~${Math.round(chainStats.total_transactions / chainStats.latest_block)} per block`
					: "",
			},
			{
				icon: Clock,
				label: "Block Time",
				value: `${chainStats.avg_block_time.toFixed(2)}s`,
				subtext: `${chainStats.min_block_time.toFixed(1)}s - ${chainStats.max_block_time.toFixed(1)}s range`,
			},
		)
	}

	if (successRate) {
		metrics.push({
			icon: TrendingUp,
			label: "Success Rate",
			value: `${successRate.success_rate_percent.toFixed(1)}%`,
			subtext: `${formatNumber(successRate.successful)} / ${formatNumber(successRate.total)}`,
		})
	}

	if (networkOverview) {
		metrics.push(
			{
				icon: Shield,
				label: "Validators",
				value: `${networkOverview.active_validators}/${networkOverview.total_validators}`,
				subtext: "active / total",
			},
			{
				icon: Users,
				label: "Total Bonded",
				value: formatNumber(networkOverview.total_bonded_tokens ?? 0),
				subtext: chainInfo.displayDenom,
			},
		)

		if (networkOverview.jailed_validators > 0) {
			metrics.push({
				icon: Zap,
				label: "Jailed",
				value: networkOverview.jailed_validators.toString(),
				subtext: "validators",
			})
		}
	}

	if (chainStats) {
		metrics.push({
			icon: Users,
			label: "Unique Addresses",
			value: formatNumber(chainStats.unique_addresses),
			subtext: "indexed",
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={css({ fontSize: "2xl" })}>Network Overview</CardTitle>
				<CardDescription>
					Real-time metrics and statistics for {chainInfo.chainId}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className={gridStyle}>
					{metrics.map((metric) => {
						const Icon = metric.icon
						return (
							<div key={metric.label} className={css({ display: "flex", flexDir: "column", gap: "2" })}>
								<div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
									<Icon className={css({ h: "5", w: "5", color: "fg.muted" })} />
									<span className={css({ fontSize: "sm", fontWeight: "medium", color: "fg.muted" })}>
										{metric.label}
									</span>
								</div>
								<div className={css({ display: "flex", flexDir: "column", gap: "0.5" })}>
									<span className={css({ fontSize: "2xl", fontWeight: "bold" })}>{metric.value}</span>
									<span className={css({ fontSize: "xs", color: "fg.muted" })}>{metric.subtext}</span>
								</div>
							</div>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}

const gridStyle = css({
	display: "grid",
	gridTemplateColumns: { base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
	gap: "6",
})
