import { useQuery } from "@tanstack/react-query"
import ReactECharts from "echarts-for-react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"

type AddressActivity = {
	dates: string[]
	counts: number[]
	totalUnique: number
}

const getActiveAddresses = async (): Promise<AddressActivity> => {
	const dailyData = await api.getActiveAddressesDaily(7)
	if (!dailyData || dailyData.length === 0) {
		return {
			dates: [],
			counts: [],
			totalUnique: 0
		}
	}

	// Sort by date and format
	const sorted = dailyData.sort((a, b) => a.date.localeCompare(b.date))
	const dates = sorted.map((d) =>
		new Date(d.date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric"
		})
	)
	const counts = sorted.map((d) => d.count)
	const totalUnique = counts.reduce((sum, c) => sum + c, 0)

	return {
		dates,
		counts,
		totalUnique
	}
}

export const ActiveAddressesChart = () => {
	const { data, isLoading } = useQuery({
		queryKey: ["active-addresses"],
		queryFn: getActiveAddresses,
		refetchInterval: 60000
	})

	if (isLoading || !data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Active Addresses</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
				</CardContent>
			</Card>
		)
	}

	const option = {
		tooltip: {
			trigger: "axis"
		},
		grid: {
			left: "3%",
			right: "4%",
			bottom: "3%",
			containLabel: true
		},
		xAxis: {
			type: "category",
			data: data.dates,
			axisLabel: { fontSize: 10 }
		},
		yAxis: {
			type: "value",
			name: "Addresses"
		},
		series: [
			{
				name: "Active Addresses",
				type: "line",
				smooth: true,
				data: data.counts,
				areaStyle: {
					color: {
						type: "linear",
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: "rgba(16, 185, 129, 0.4)" },
							{ offset: 1, color: "rgba(16, 185, 129, 0.05)" }
						]
					}
				},
				lineStyle: { color: "#10b981", width: 2 },
				itemStyle: { color: "#10b981" }
			}
		]
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Active Addresses</CardTitle>
			</CardHeader>
			<CardContent>
				<ReactECharts option={option} style={{ height: "250px" }} />
			</CardContent>
		</Card>
	)
}
