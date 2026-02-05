import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ReactECharts from "echarts-for-react"
import { useQuery } from "@tanstack/react-query"
import { Activity } from "lucide-react"
import { api } from "@/lib/api"
import { css } from "@/styled-system/css"
import { token } from "@/styled-system/tokens"

interface ValidatorSigningChartProps {
	consensusAddress: string | null | undefined
	limit?: number
}

/**
 * Chart showing recent block signing history for a validator
 * Displays signed (green) vs missed (red) blocks over time
 */
export function ValidatorSigningChart({ consensusAddress, limit = 200 }: ValidatorSigningChartProps) {
	const { data, isLoading, error } = useQuery({
		queryKey: ["validator-block-signatures", consensusAddress, limit],
		queryFn: () => consensusAddress ? api.getValidatorBlockSignatures(consensusAddress, limit) : null,
		enabled: !!consensusAddress,
		staleTime: 15000,
		retry: 1,
	})

	if (!consensusAddress) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={styles.titleFlex}>
						<Activity className={styles.icon} />
						Signing History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={styles.message}>No consensus address available</div>
				</CardContent>
			</Card>
		)
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={styles.titleFlex}>
						<Activity className={styles.icon} />
						Signing History
					</CardTitle>
					<CardDescription>Recent block signing activity</CardDescription>
				</CardHeader>
				<CardContent>
					<div className={styles.loadingContainer}>Loading chart data...</div>
				</CardContent>
			</Card>
		)
	}

	if (error || !data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={styles.titleFlex}>
						<Activity className={styles.icon} />
						Signing History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={styles.message}>
						{error ? "Failed to load signing data" : "No signing data available yet"}
					</div>
				</CardContent>
			</Card>
		)
	}

	// Sort by height ascending for chart display
	const sortedData = [...data].sort((a, b) => a.height - b.height)

	// Calculate statistics
	const signedCount = sortedData.filter(d => d.signed).length
	const missedCount = sortedData.filter(d => !d.signed).length
	const signingPercent = ((signedCount / sortedData.length) * 100).toFixed(1)
	const minHeight = sortedData[0]?.height
	const maxHeight = sortedData[sortedData.length - 1]?.height

	const option = {
		tooltip: {
			trigger: "axis",
			backgroundColor: token("colors.bg.muted"),
			borderColor: token("colors.border.accent"),
			textStyle: { color: token("colors.fg.default") },
			formatter: (params: any) => {
				const point = params[0]
				const dataItem = sortedData[point.dataIndex]
				if (!dataItem) return ""
				const status = dataItem.signed ? "Signed" : "Missed"
				const statusColor = dataItem.signed ? token("colors.republicGreen.7") : "#EF4444"
				return `<div style="font-size: 13px;">
					<strong>Block #${dataItem.height.toLocaleString()}</strong><br/>
					Status: <span style="color: ${statusColor}; font-weight: 600;">${status}</span>
				</div>`
			}
		},
		grid: {
			left: "3%",
			right: "4%",
			bottom: "8%",
			top: "8%",
			containLabel: true
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			data: sortedData.map(d => d.height),
			axisLabel: {
				color: "#707B92",
				fontSize: 11,
				formatter: (value: number) => value.toLocaleString(),
				interval: Math.floor(sortedData.length / 6)
			},
			axisLine: { lineStyle: { color: token("colors.border.default") } },
			splitLine: { show: false }
		},
		yAxis: {
			type: "value",
			min: 0,
			max: 1,
			axisLabel: { show: false },
			axisLine: { show: false },
			splitLine: { show: false }
		},
		visualMap: {
			show: false,
			pieces: [
				{ value: 0, color: "#EF4444" },
				{ value: 1, color: token("colors.republicGreen.7") }
			]
		},
		series: [{
			name: "Signing Status",
			type: "bar",
			barWidth: "100%",
			data: sortedData.map(d => d.signed ? 1 : 0),
			itemStyle: {
				color: (params: any) => {
					const dataItem = sortedData[params.dataIndex]
					return dataItem?.signed ? token("colors.republicGreen.7") : "#EF4444"
				}
			}
		}]
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={styles.titleFlex}>
					<Activity className={styles.icon} />
					Signing History
				</CardTitle>
				<CardDescription>
					Last {sortedData.length} blocks (#{minHeight?.toLocaleString()} - #{maxHeight?.toLocaleString()}) | {signingPercent}% signed | {signedCount.toLocaleString()} signed, {missedCount.toLocaleString()} missed
				</CardDescription>
			</CardHeader>
			<CardContent className={styles.content}>
				<ReactECharts option={option} style={{ height: "100px" }} opts={{ renderer: "canvas" }} notMerge={true} lazyUpdate={true} />
				<div className={styles.legend}>
					<span className={styles.legendItem}>
						<span className={styles.legendDotGreen} />
						Signed
					</span>
					<span className={styles.legendItem}>
						<span className={styles.legendDotRed} />
						Missed
					</span>
				</div>
			</CardContent>
		</Card>
	)
}

const styles = {
	titleFlex: css({ display: "flex", alignItems: "center", gap: "2" }),
	icon: css({ h: "5", w: "5" }),
	loadingContainer: css({ h: "100px", display: "flex", alignItems: "center", justifyContent: "center", color: "fg.muted" }),
	message: css({ py: "8", textAlign: "center", color: "fg.muted" }),
	content: css({ p: "4" }),
	legend: css({
		display: "flex",
		justifyContent: "center",
		gap: "4",
		mt: "2",
		fontSize: "xs",
		color: "fg.muted"
	}),
	legendItem: css({
		display: "flex",
		alignItems: "center",
		gap: "1"
	}),
	legendDotGreen: css({
		width: "8px",
		height: "8px",
		borderRadius: "full",
		bg: "republicGreen.default"
	}),
	legendDotRed: css({
		width: "8px",
		height: "8px",
		borderRadius: "full",
		bg: "red.500"
	})
}
