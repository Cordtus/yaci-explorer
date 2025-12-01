import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'
import { getBlockIntervals } from '@/lib/metrics'

export function BlockIntervalChart() {
	const lookback = appConfig.analytics.blockIntervalLookback
	const { data, isLoading } = useQuery({
		queryKey: ['block-intervals', lookback],
		queryFn: () => getBlockIntervals(lookback),
		refetchInterval: appConfig.analytics.blockIntervalRefetchMs,
	})

	if (isLoading || !data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Block Interval</CardTitle>
					<CardDescription>Block production time over recent blocks</CardDescription>
				</CardHeader>
				<CardContent>
					<div className={styles.loadingContainer}>
						Loading...
					</div>
				</CardContent>
			</Card>
		)
	}

	const avgBlockTime = data.reduce((sum, d) => sum + d.time, 0) / data.length
	const minBlockTime = Math.min(...data.map((d) => d.time))
	const maxBlockTime = Math.max(...data.map((d) => d.time))

	const option = {
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(15, 23, 42, 0.95)',
			borderColor: 'rgba(52, 211, 153, 0.5)',
			textStyle: { color: '#f1f5f9' },
			axisPointer: {
				type: 'line',
				lineStyle: { color: '#34d399', width: 1 }
			},
			formatter: (params: any) => {
				const point = params[0]
				return `<div style="font-size: 13px;">
					<strong>Block ${Number(point.name).toLocaleString()}</strong><br/>
					Interval: <span style="color: #6ee7b7; font-weight: 600;">${point.value[1].toFixed(2)}s</span>
				</div>`
			},
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '8%',
			top: '8%',
			containLabel: true,
		},
		xAxis: {
			type: 'category',
			data: data.map((d) => d.height),
			axisLabel: {
				color: '#cbd5e1',
				fontSize: 11,
				rotate: 0,
				interval: Math.floor(data.length / 6),
				formatter: (value: number) => value.toLocaleString(),
			},
			axisLine: { lineStyle: { color: '#475569' } },
			splitLine: { show: false },
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				color: '#cbd5e1',
				fontSize: 11,
				formatter: '{value}s',
			},
			axisLine: { show: false },
			splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
		},
		series: [{
			name: 'Block Interval',
			type: 'line',
			data: data.map((d) => [d.height, d.time]),
			smooth: true,
			symbol: 'circle',
			symbolSize: 6,
			itemStyle: { color: '#34d399' },
			lineStyle: { width: 3, color: '#34d399' },
			areaStyle: {
				color: {
					type: 'linear',
					x: 0, y: 0, x2: 0, y2: 1,
					colorStops: [
						{ offset: 0, color: 'rgba(52, 211, 153, 0.4)' },
						{ offset: 1, color: 'rgba(52, 211, 153, 0.05)' },
					],
				},
			},
			markLine: {
				silent: true,
				symbol: 'none',
				lineStyle: { type: 'dashed', color: '#fbbf24', width: 2 },
				label: {
					color: '#fcd34d',
					fontSize: 12,
					fontWeight: 'bold',
					formatter: `Avg: ${avgBlockTime.toFixed(2)}s`,
				},
				data: [{ yAxis: avgBlockTime }],
			},
		}],
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Block Production Interval</CardTitle>
				<CardDescription>
					Last {lookback.toLocaleString()} blocks | Avg: {avgBlockTime.toFixed(2)}s | Min: {minBlockTime.toFixed(2)}
					s | Max: {maxBlockTime.toFixed(2)}s
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ReactECharts option={option} style={{ height: '300px' }} opts={{ renderer: 'canvas' }} notMerge={true} lazyUpdate={true} />
			</CardContent>
		</Card>
	)
}

const styles = {
	loadingContainer: css({ h: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'fg.muted' }),
}
