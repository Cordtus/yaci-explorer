import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'
import { getEnv } from '@/lib/env'

interface BlockTimeData {
  height: number
  time: number
  timestamp: string
}

async function getBlockIntervalData(limit: number): Promise<BlockTimeData[]> {
  const baseUrl = getEnv('VITE_POSTGREST_URL', 'http://localhost:3000')
  if (!baseUrl) {
    return []
  }
  const response = await fetch(
    `${baseUrl}/blocks_raw?order=id.desc&limit=${limit}`
  )
  const blocks = await response.json()

  const data: BlockTimeData[] = []
  for (let i = 0; i < blocks.length - 1; i++) {
    const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
    const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
    const diff = (currentTime - previousTime) / 1000

    if (diff > 0 && diff < appConfig.analytics.blockIntervalMaxSeconds) {
      data.push({
        height: blocks[i].id,
        time: diff,
        timestamp: blocks[i].data?.block?.header?.time,
      })
    }
  }

  return data.reverse()
}

export function BlockIntervalChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['block-intervals', appConfig.analytics.blockIntervalLookback],
    queryFn: () => getBlockIntervalData(appConfig.analytics.blockIntervalLookback),
    refetchInterval: appConfig.analytics.blockIntervalRefetchMs,
  })
  const lookbackLabel = appConfig.analytics.blockIntervalLookback.toLocaleString()

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
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: { color: '#e2e8f0' },
      axisPointer: {
        type: 'cross',
        label: { backgroundColor: '#334155' }
      },
      formatter: (params: any) => {
        const point = params[0]
        return `<div style="font-size: 13px;">
          <strong>Block ${Number(point.name).toLocaleString()}</strong><br/>
          Interval: <span style="color: #34d399; font-weight: 600;">${point.value[1].toFixed(2)}s</span>
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
        color: '#94a3b8',
        fontSize: 11,
        rotate: 0,
        interval: Math.floor(data.length / 6),
        formatter: (value: number) => value.toLocaleString(),
      },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: '{value}s',
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
    },
    series: [{
      name: 'Block Interval',
      type: 'line',
      data: data.map((d) => [d.height, d.time]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#10b981' },
      lineStyle: { width: 2.5, color: '#10b981' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#f59e0b', width: 1.5 },
        label: {
          color: '#fbbf24',
          fontSize: 11,
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
          Last {lookbackLabel} blocks | Avg: {avgBlockTime.toFixed(2)}s | Min: {minBlockTime.toFixed(2)}
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
