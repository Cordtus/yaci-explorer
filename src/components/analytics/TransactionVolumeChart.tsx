import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'
import { appConfig } from '@/config/app'
import { css } from '@/styled-system/css'

interface VolumeData {
  time: string
  count: number
}

async function getTransactionVolume(hours: number = 24): Promise<VolumeData[]> {
  const hourlyVolume = await api.getHourlyTransactionVolume(hours)

  // Build map using ISO hour prefix for matching (e.g., "2025-11-27T04")
  const volumeMap = new Map(
    hourlyVolume.map(d => [d.hour.substring(0, 13), d.count])
  )

  const result: VolumeData[] = []
  const now = new Date()
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

  // Fill in all hours, including those with 0 transactions
  for (let time = new Date(startTime); time <= now; time.setHours(time.getHours() + 1)) {
    const hourKey = time.toISOString().substring(0, 13)
    result.push({
      time: time.toISOString(),
      count: volumeMap.get(hourKey) || 0
    })
  }

  return result
}

export function TransactionVolumeChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['transaction-volume', appConfig.analytics.transactionVolumeHours],
    queryFn: () => getTransactionVolume(appConfig.analytics.transactionVolumeHours),
    refetchInterval: appConfig.analytics.transactionVolumeRefetchMs,
  })
  const hoursLabel = appConfig.analytics.transactionVolumeHours.toLocaleString()

  if (isLoading || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={styles.titleFlex}>
            <TrendingUp className={styles.icon} />
            Transaction Volume
          </CardTitle>
          <CardDescription>{hoursLabel}-hour transaction activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.loadingContainer}>
            Loading chart data...
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate statistics
  const totalTx = data.reduce((sum, d) => sum + d.count, 0)
  const avgTxPerHour = Math.round(totalTx / data.length)
  const peakHour = data.reduce((max, d) => d.count > max.count ? d : max, data[0])

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0D0F0F',
      borderColor: 'rgba(48, 255, 110, 0.25)',
      textStyle: { color: '#FFFFFF' },
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#30FF6E', width: 1 }
      },
      formatter: (params: any) => {
        const date = new Date(params[0].axisValue)
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        return `<div style="font-size: 13px;">
          <strong>${dateStr} ${timeStr}</strong><br/>
          Transactions: <span style="color: #30FF6E; font-weight: 600;">${params[0].value}</span>
        </div>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.time),
      axisLabel: {
        color: '#707B92',
        fontSize: 11,
        formatter: (value: string) => {
          const date = new Date(value)
          return date.toLocaleTimeString([], { hour: '2-digit' })
        },
        interval: Math.floor(data.length / 8)
      },
      axisLine: { lineStyle: { color: 'rgba(94, 94, 94, 0.25)' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#707B92',
        fontSize: 11,
        formatter: '{value}'
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(94, 94, 94, 0.25)', type: 'dashed' } }
    },
    series: [{
      name: 'Transactions',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      sampling: 'average',
      itemStyle: { color: '#30FF6E' },
      lineStyle: { width: 3, color: '#30FF6E' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(48, 255, 110, 0.4)' },
            { offset: 1, color: 'rgba(48, 255, 110, 0.05)' }
          ]
        }
      },
      data: data.map(d => d.count)
    }]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={styles.titleFlex}>
          <TrendingUp className={styles.icon} />
          Transaction Volume
        </CardTitle>
        <CardDescription>
          Last {hoursLabel}h * {totalTx.toLocaleString()} total * {avgTxPerHour} avg/hour * Peak: {peakHour.count} at {new Date(peakHour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  content: css({ p: '4' }),
}
