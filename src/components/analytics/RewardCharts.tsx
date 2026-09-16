import { useQuery } from "@tanstack/react-query"
import ReactECharts from "echarts-for-react"
import { Award } from "lucide-react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useChain } from "@/contexts/ChainContext"
import { getChartColors } from "@/theme/chartTheme"
import { css } from "@/styled-system/css"

function readAccentColor(): string {
	if (typeof document === "undefined") return "#3b82f6"
	const val = getComputedStyle(document.documentElement).getPropertyValue("--chain-accent")
	return val?.trim() || "#3b82f6"
}

/** Area chart showing hourly rewards and commission over the last 24 hours */
export function HourlyRewardsChart() {
	const { api, chainInfo } = useChain()
	const colors = getChartColors()

	const { data, isLoading } = useQuery({
		queryKey: ["hourly-rewards", chainInfo.chainId],
		queryFn: () => api.getHourlyRewards(48),
		staleTime: 60_000,
	})

	if (isLoading || !data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleStyle}><Award className={iconStyle} />Hourly Rewards</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className={css({ h: "250px", w: "full" })} />
				</CardContent>
			</Card>
		)
	}

	if (data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleStyle}><Award className={iconStyle} />Hourly Rewards</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={css({ py: "8", textAlign: "center", color: "fg.muted" })}>
						No reward data available yet
					</div>
				</CardContent>
			</Card>
		)
	}

	const sorted = [...data].sort((a, b) => a.hour.localeCompare(b.hour))
	const accent = readAccentColor()

	const option = {
		tooltip: {
			trigger: "axis",
			backgroundColor: "rgba(0,0,0,0.8)",
			textStyle: { color: "#fff", fontSize: 12 },
		},
		grid: { left: "3%", right: "3%", bottom: "3%", top: "10%", containLabel: true },
		xAxis: {
			type: "category",
			data: sorted.map((d) => {
				const date = new Date(d.hour)
				return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
			}),
			axisLine: { lineStyle: { color: colors.axis } },
			axisLabel: { fontSize: 10, color: colors.axis },
		},
		yAxis: {
			type: "value",
			splitLine: { lineStyle: { color: colors.grid } },
			axisLabel: { fontSize: 10, color: colors.axis },
		},
		series: [
			{
				name: "Rewards",
				type: "line",
				smooth: true,
				areaStyle: { opacity: 0.2 },
				lineStyle: { width: 2 },
				itemStyle: { color: accent },
				data: sorted.map((d) => parseFloat(d.rewards) || 0),
			},
			{
				name: "Commission",
				type: "line",
				smooth: true,
				areaStyle: { opacity: 0.1 },
				lineStyle: { width: 2, type: "dashed" },
				itemStyle: { color: colors.gas },
				data: sorted.map((d) => parseFloat(d.commission) || 0),
			},
		],
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={titleStyle}><Award className={iconStyle} />Hourly Rewards</CardTitle>
				<CardDescription>Block rewards and commission over the last 48 hours</CardDescription>
			</CardHeader>
			<CardContent>
				<ReactECharts option={option} style={{ height: "250px" }} />
			</CardContent>
		</Card>
	)
}

/** Bar chart showing daily reward aggregation over the last 30 days */
export function DailyRewardsChart() {
	const { api, chainInfo } = useChain()
	const colors = getChartColors()

	const { data, isLoading } = useQuery({
		queryKey: ["daily-rewards", chainInfo.chainId],
		queryFn: () => api.getDailyRewards(30),
		staleTime: 60_000,
	})

	if (isLoading || !data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleStyle}><Award className={iconStyle} />Daily Rewards</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className={css({ h: "250px", w: "full" })} />
				</CardContent>
			</Card>
		)
	}

	if (data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={titleStyle}><Award className={iconStyle} />Daily Rewards</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={css({ py: "8", textAlign: "center", color: "fg.muted" })}>
						No daily reward data available yet
					</div>
				</CardContent>
			</Card>
		)
	}

	const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
	const accent = readAccentColor()

	const option = {
		tooltip: {
			trigger: "axis",
			backgroundColor: "rgba(0,0,0,0.8)",
			textStyle: { color: "#fff", fontSize: 12 },
		},
		grid: { left: "3%", right: "3%", bottom: "3%", top: "10%", containLabel: true },
		xAxis: {
			type: "category",
			data: sorted.map((d) => d.date),
			axisLine: { lineStyle: { color: colors.axis } },
			axisLabel: { fontSize: 10, color: colors.axis, rotate: 30 },
		},
		yAxis: {
			type: "value",
			splitLine: { lineStyle: { color: colors.grid } },
			axisLabel: { fontSize: 10, color: colors.axis },
		},
		series: [
			{
				name: "Rewards",
				type: "bar",
				itemStyle: { color: accent, borderRadius: [3, 3, 0, 0] },
				data: sorted.map((d) => parseFloat(d.total_rewards) || 0),
			},
			{
				name: "Commission",
				type: "bar",
				itemStyle: { color: colors.gas, borderRadius: [3, 3, 0, 0] },
				data: sorted.map((d) => parseFloat(d.total_commission) || 0),
			},
		],
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={titleStyle}><Award className={iconStyle} />Daily Rewards</CardTitle>
				<CardDescription>
					Block rewards and commission over the last {sorted.length} days ({sorted[sorted.length - 1]?.validators_earning ?? 0} validators earning)
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ReactECharts option={option} style={{ height: "250px" }} />
			</CardContent>
		</Card>
	)
}

const titleStyle = css({ display: "flex", alignItems: "center", gap: "2" })
const iconStyle = css({ h: "5", w: "5" })
