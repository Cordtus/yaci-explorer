import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'

export function DailyActiveAddressesChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['daily-active-addresses'],
    queryFn: () => api.getDailyActiveAddresses(30),
    refetchInterval: 60000,
  })

  if (isLoading || !data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Active Addresses</CardTitle>
          <CardDescription>Unique addresses sending transactions per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.loadingContainer}>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  // Reverse for chronological order (oldest first)
  const chartData = [...data].reverse()

  // Calculate stats
  const total = chartData.reduce((sum, d) => sum + d.active_addresses, 0)
  const avg = Math.round(total / chartData.length)
  const max = Math.max(...chartData.map(d => d.active_addresses))
  const latest = data[0]?.active_addresses || 0

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown[]) => {
        const point = (params as Array<{ name: string; value: number }>)[0]
        const date = new Date(point.name)
        return `
          <div style="font-size: 12px;">
            <strong>${date.toLocaleDateString()}</strong><br/>
            Active addresses: ${point.value.toLocaleString()}
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.date),
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        },
        rotate: 45,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
          return value.toString()
        },
      },
    },
    series: [
      {
        name: 'Active Addresses',
        type: 'line',
        data: chartData.map((d) => d.active_addresses),
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168, 85, 247, 0.4)' },
              { offset: 1, color: 'rgba(168, 85, 247, 0.05)' },
            ],
          },
        },
        lineStyle: {
          color: '#a855f7',
          width: 2,
        },
        itemStyle: {
          color: '#a855f7',
        },
        symbol: 'circle',
        symbolSize: 4,
      },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Active Addresses</CardTitle>
        <CardDescription>
          Today: {latest.toLocaleString()} | Avg: {avg.toLocaleString()} | Peak: {max.toLocaleString()}
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
