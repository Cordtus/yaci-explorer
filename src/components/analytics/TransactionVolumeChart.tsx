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
  gasUsed: number
}

async function getTransactionVolume(hours: number = 24): Promise<VolumeData[]> {
  // Get hourly volume from api
  const hourlyVolume = await api.getHourlyTransactionVolume(hours)

  // Convert to VolumeData format with empty hours filled in
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000)
  const volumeMap = new Map(hourlyVolume.map(d => [d.hour, d.count]))

  const result: VolumeData[] = []
  const endTime = new Date()

  for (let time = new Date(hoursAgo); time <= endTime; time.setHours(time.getHours() + 1)) {
    const hourStr = `${time.toISOString().split('T')[0]} ${time.getHours().toString().padStart(2, '0')}:00`
    result.push({
      time: `${time.toISOString().substring(0, 13)}:00:00`,
      count: volumeMap.get(hourStr) || 0,
      gasUsed: 0 // Gas data not available from hourly aggregation
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
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: (params: any) => {
        const date = new Date(params[0].axisValue)
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return `
          <div style="font-size: 12px;">
            <strong>${timeStr}</strong><br/>
            Transactions: ${params[0].value}<br/>
            Gas Used: ${(params[1].value / 1000000).toFixed(2)}M
          </div>
        `
      }
    },
    legend: {
      data: ['Transactions', 'Gas Used'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.time),
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return date.toLocaleTimeString([], { hour: '2-digit' })
        },
        interval: Math.floor(data.length / 8) // Show ~8 labels
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Transactions',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3b82f6'
          }
        }
      },
      {
        type: 'value',
        name: 'Gas (M)',
        position: 'right',
        axisLabel: {
          formatter: (value: number) => (value / 1000000).toFixed(1)
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#10b981'
          }
        }
      }
    ],
    series: [
      {
        name: 'Transactions',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        sampling: 'average',
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(59, 130, 246, 0.2)'
            }, {
              offset: 1, color: 'rgba(59, 130, 246, 0.05)'
            }]
          }
        },
        data: data.map(d => d.count)
      },
      {
        name: 'Gas Used',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: '#10b981'
        },
        lineStyle: {
          width: 2,
          type: 'dashed'
        },
        data: data.map(d => d.gasUsed)
      }
    ]
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
