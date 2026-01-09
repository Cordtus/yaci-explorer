import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight } from 'lucide-react'
import { api } from '@/lib/api'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'

/**
 * IBC Volume Chart - shows incoming and outgoing IBC transfer volume over time
 * Displays two lines: one for outgoing transfers, one for incoming transfers
 */
export function IbcVolumeChart() {
	const { data, isLoading } = useQuery({
		queryKey: ['ibc-volume-timeseries', appConfig.analytics.transactionVolumeHours],
		queryFn: () => api.getIbcVolumeTimeSeries(appConfig.analytics.transactionVolumeHours),
		refetchInterval: appConfig.analytics.transactionVolumeRefetchMs
	})
	const hoursLabel = appConfig.analytics.transactionVolumeHours.toLocaleString()

	if (isLoading || !data || data.data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className={styles.titleFlex}>
						<ArrowLeftRight className={styles.icon} />
						IBC Transfer Volume
					</CardTitle>
					<CardDescription>{hoursLabel}-hour IBC transfer activity</CardDescription>
				</CardHeader>
				<CardContent>
					<div className={styles.loadingContainer}>
						Loading chart data...
					</div>
				</CardContent>
			</Card>
		)
	}

	const totalOutgoing = data.data.reduce((sum, d) => sum + d.outgoing_count, 0)
	const totalIncoming = data.data.reduce((sum, d) => sum + d.incoming_count, 0)
	const totalTransfers = totalOutgoing + totalIncoming
	const activeChannels = data.channels.length

	const option = {
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(15, 23, 42, 0.95)',
			borderColor: 'rgba(6, 182, 212, 0.5)',
			textStyle: { color: '#f1f5f9' },
			axisPointer: {
				type: 'line',
				lineStyle: { color: '#06b6d4', width: 1 }
			},
			formatter: (params: { axisValue: string; value: number; seriesName: string; color: string }[]) => {
				const date = new Date(params[0].axisValue)
				const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
				const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
				let content = `<div style="font-size: 13px;"><strong>${dateStr} ${timeStr}</strong><br/>`
				for (const p of params) {
					content += `<span style="color: ${p.color};">${p.seriesName}</span>: <strong>${p.value}</strong><br/>`
				}
				content += '</div>'
				return content
			}
		},
		legend: {
			data: ['Outgoing', 'Incoming'],
			top: 0,
			right: 10,
			textStyle: { color: '#cbd5e1', fontSize: 12 }
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '8%',
			top: '15%',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			boundaryGap: false,
			data: data.data.map(d => d.hour),
			axisLabel: {
				color: '#cbd5e1',
				fontSize: 11,
				formatter: (value: string) => {
					const date = new Date(value)
					return date.toLocaleTimeString([], { hour: '2-digit' })
				},
				interval: Math.floor(data.data.length / 8)
			},
			axisLine: { lineStyle: { color: '#475569' } },
			splitLine: { show: false }
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				color: '#cbd5e1',
				fontSize: 11,
				formatter: '{value}'
			},
			axisLine: { show: false },
			splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
		},
		series: [
			{
				name: 'Outgoing',
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 5,
				sampling: 'average',
				itemStyle: { color: '#f97316' },
				lineStyle: { width: 2, color: '#f97316' },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0, y: 0, x2: 0, y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
							{ offset: 1, color: 'rgba(249, 115, 22, 0.02)' }
						]
					}
				},
				data: data.data.map(d => d.outgoing_count)
			},
			{
				name: 'Incoming',
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 5,
				sampling: 'average',
				itemStyle: { color: '#22c55e' },
				lineStyle: { width: 2, color: '#22c55e' },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0, y: 0, x2: 0, y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
							{ offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
						]
					}
				},
				data: data.data.map(d => d.incoming_count)
			}
		]
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className={styles.titleFlex}>
					<ArrowLeftRight className={styles.icon} />
					IBC Transfer Volume
				</CardTitle>
				<CardDescription>
					Last {hoursLabel}h * {totalTransfers.toLocaleString()} total ({totalOutgoing} out, {totalIncoming} in) * {activeChannels} active channels
				</CardDescription>
			</CardHeader>
			<CardContent className={styles.content}>
				<ReactECharts option={option} style={{ height: '300px' }} opts={{ renderer: 'canvas' }} notMerge={true} lazyUpdate={true} />
			</CardContent>
		</Card>
	)
}

const styles = {
	titleFlex: css({ display: 'flex', alignItems: 'center', gap: '2' }),
	icon: css({ h: '5', w: '5' }),
	loadingContainer: css({ h: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'fg.muted' }),
	content: css({ p: '4' })
}
