import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { YaciAPIClient } from '@yaci/database-client'

const client = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

export function FeeRevenueChart({ days = 7 }: { days?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['fee-revenue', days],
    queryFn: () => client.getFeeRevenueOverTime(days),
    refetchInterval: 30000,
  })

  if (isLoading || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Revenue Over Time</CardTitle>
          <CardDescription>Daily fee collection by denomination</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extract all unique denominations
  const denoms = new Set<string>()
  data.forEach((day) => {
    Object.keys(day.revenue).forEach((denom) => denoms.add(denom))
  })
  const denomList = Array.from(denoms)

  // Calculate total revenue per denom
  const totalRevenue: Record<string, number> = {}
  data.forEach((day) => {
    Object.entries(day.revenue).forEach(([denom, amount]) => {
      totalRevenue[denom] = (totalRevenue[denom] || 0) + amount
    })
  })

  // Format denom names (remove 'u' prefix for display)
  const formatDenom = (denom: string) => {
    return denom.startsWith('u') ? denom.slice(1).toUpperCase() : denom.toUpperCase()
  }

  // Format amount (divide by 1e6 for micro denomination)
  const formatAmount = (amount: number, denom: string) => {
    return denom.startsWith('u') ? amount / 1e6 : amount
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        let tooltip = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach((param: any) => {
          const value = param.value
          tooltip += `${param.marker} ${param.seriesName}: ${value.toFixed(2)}<br/>`
        })
        return tooltip
      },
    },
    legend: {
      data: denomList.map(formatDenom),
      top: 'bottom',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLabel: {
        rotate: 45,
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Fee Revenue',
      nameLocation: 'middle',
      nameGap: 60,
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
          return value.toFixed(0)
        },
      },
    },
    series: denomList.map((denom) => ({
      name: formatDenom(denom),
      type: 'line',
      stack: 'total',
      areaStyle: {},
      emphasis: {
        focus: 'series',
      },
      data: data.map((d) => formatAmount(d.revenue[denom] || 0, denom)),
      smooth: true,
    })),
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Revenue Over Time</CardTitle>
        <CardDescription>
          Last {days} days |{' '}
          {Object.entries(totalRevenue)
            .map(
              ([denom, amount]) =>
                `${formatAmount(amount, denom).toFixed(2)} ${formatDenom(denom)}`
            )
            .join(' + ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '400px' }} opts={{ renderer: 'canvas' }} />
      </CardContent>
    </Card>
  )
}
