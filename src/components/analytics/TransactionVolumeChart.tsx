import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { type VolumeData } from '@/types/components/analytics/transaction-volume'

async function getTransactionVolume(hours: number = 24): Promise<VolumeData[]> {
  const baseUrl = import.meta.env.VITE_POSTGREST_URL
  if (!baseUrl) {
    throw new Error('VITE_POSTGREST_URL environment variable is not set')
  }
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const response = await fetch(
    `${baseUrl}/transactions_main?select=timestamp,fee&timestamp=gte.${hoursAgo}&order=timestamp.asc`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch transaction volume data')
  }

  const transactions = await response.json()

  // Group by hour
  const hourlyData: { [key: string]: { count: number; gasUsed: number } } = {}

  transactions.forEach((tx: any) => {
    const hour = new Date(tx.timestamp).toISOString().substring(0, 13) + ':00:00'
    if (!hourlyData[hour]) {
      hourlyData[hour] = { count: 0, gasUsed: 0 }
    }
    hourlyData[hour].count++
    // Calculate gas from fee.gasLimit if available
    hourlyData[hour].gasUsed += parseInt(tx.fee?.gasLimit || 0)
  })

  // Convert to array and ensure all hours are present
  const result: VolumeData[] = []
  const startTime = new Date(hoursAgo)
  const endTime = new Date()

  for (let time = new Date(startTime); time <= endTime; time.setHours(time.getHours() + 1)) {
    const hourStr = time.toISOString().substring(0, 13) + ':00:00'
    result.push({
      time: hourStr,
      count: hourlyData[hourStr]?.count || 0,
      gasUsed: hourlyData[hourStr]?.gasUsed || 0
    })
  }

  return result
}

export function TransactionVolumeChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['transaction-volume'],
    queryFn: () => getTransactionVolume(24),
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transaction Volume
          </CardTitle>
          <CardDescription>24-hour transaction activity</CardDescription>
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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Transaction Volume
        </CardTitle>
        <CardDescription>
          {totalTx.toLocaleString()} total • {avgTxPerHour} avg/hour • Peak: {peakHour.count} at {new Date(peakHour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ReactECharts option={option} style={{ height: '300px' }} opts={{ renderer: 'canvas' }} />
      </CardContent>
    </Card>
  )
}
