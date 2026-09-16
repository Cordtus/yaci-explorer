import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card"
import ReactECharts from "echarts-for-react"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp } from "lucide-react"
import { api } from "@/lib/api"
import { appConfig } from "@/config/app"
import { css } from "../../../styled-system/css"
import { getChartColors } from "@/theme/chartTheme"

interface VolumeData {
	time: string
	count: number
	gasUsed: number
}

async function getTransactionVolume(hours: number = 24): Promise<VolumeData[]> {
	// Get hourly volume from api
	const hourlyVolume = await api.getHourlyTransactionVolume(hours)

	// Convert to VolumeData format with empty hours filled in
	const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000)
	const volumeMap = new Map(hourlyVolume.map((d) => [d.hour, d.count]))

	const result: VolumeData[] = []
	const endTime = new Date()

	for (
		let time = new Date(hoursAgo);
		time <= endTime;
		time.setHours(time.getHours() + 1)
	) {
		const hourStr = `${time.toISOString().split("T")[0]} ${time.getHours().toString().padStart(2, "0")}:00`
		result.push({
			time: time.toISOString().substring(0, 13) + ":00:00",
			count: volumeMap.get(hourStr) || 0,
			gasUsed: 0 // Gas data not available from hourly aggregation
		})
	}

	return result
}

export function TransactionVolumeChart() {
	const { data, isLoading } = useQuery({
		queryKey: [
			"transaction-volume",
			appConfig.analytics.transactionVolumeHours
		],
		queryFn: () =>
			getTransactionVolume(appConfig.analytics.transactionVolumeHours),
		refetchInterval: appConfig.analytics.transactionVolumeRefetchMs
	})
	const hoursLabel = appConfig.analytics.transactionVolumeHours.toLocaleString()
	const chartColors = getChartColors()

	if (isLoading || !data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Transaction Volume
					</CardTitle>
					<CardDescription>
						{hoursLabel}-hour transaction activity
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-[300px] flex items-center justify-center text-muted-foreground">
						Loading chart data...
					</div>
				</CardContent>
			</Card>
		)
	}

	// Calculate statistics
	const totalTx = data.reduce((sum, d) => sum + d.count, 0)
	const avgTxPerHour = Math.round(totalTx / data.length)
	const peakHour = data.reduce(
		(max, d) => (d.count > max.count ? d : max),
		data[0]
	)

	const option = {
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "cross",
				label: {
					backgroundColor: chartColors.grid
				}
			},
			formatter: (params: any) => {
				const date = new Date(params[0].axisValue)
				const timeStr = date.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit"
				})
				return `
          <div style="font-size: 12px; color: ${chartColors.axis};">
            <strong>${timeStr}</strong><br/>
            <span style="color:${chartColors.transactions}">Transactions: ${params[0].value}</span><br/>
            <span style="color:${chartColors.gas}">Gas Used: ${(params[1].value / 1000000).toFixed(2)}M</span>
          </div>
        `
			}
		},
		legend: {
			data: ["Transactions", "Gas Used"],
			bottom: 0,
			textStyle: {
				color: chartColors.axis
			}
		},
		grid: {
			left: "3%",
			right: "4%",
			bottom: "15%",
			top: "10%",
			containLabel: true
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			data: data.map((d) => d.time),
			axisLabel: {
				formatter: (value: string) => {
					const date = new Date(value)
					return date.toLocaleTimeString([], { hour: "2-digit" })
				},
				interval: Math.floor(data.length / 8), // Show ~8 labels
				color: chartColors.axis
			}
		},
		yAxis: [
			{
				type: "value",
				name: "Transactions",
				position: "left",
				axisLabel: {
					formatter: "{value}",
					color: chartColors.axis
				},
				axisLine: {
					show: true,
					lineStyle: {
						color: chartColors.transactions
					}
				}
			},
			{
				type: "value",
				name: "Gas (M)",
				position: "right",
				axisLabel: {
					formatter: (value: number) => (value / 1000000).toFixed(1),
					color: chartColors.axis
				},
				axisLine: {
					show: true,
					lineStyle: {
						color: chartColors.gas
					}
				}
			}
		],
		series: [
			{
				name: "Transactions",
				type: "line",
				smooth: true,
				symbol: "circle",
				symbolSize: 4,
				sampling: "average",
				itemStyle: {
					color: chartColors.transactions
				},
				areaStyle: {
					color: chartColors.transactions,
					opacity: 0.18
				},
				data: data.map((d) => d.count)
			},
			{
				name: "Gas Used",
				type: "line",
				smooth: true,
				yAxisIndex: 1,
				symbol: "none",
				sampling: "average",
				itemStyle: {
					color: chartColors.gas
				},
				lineStyle: {
					width: 2,
					type: "dashed"
				},
				data: data.map((d) => d.gasUsed)
			}
		]
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Transaction Volume
				</CardTitle>
				<CardDescription>
					Last {hoursLabel}h * {totalTx.toLocaleString()} total * {avgTxPerHour}{" "}
					avg/hour * Peak: {peakHour.count} at{" "}
					{new Date(peakHour.time).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit"
					})}
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4">
				<ReactECharts
					option={option}
					className={css({ h: "300px" })}
					opts={{ renderer: "canvas" }}
				/>
			</CardContent>
		</Card>
	)
}
